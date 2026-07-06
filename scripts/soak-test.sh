#!/usr/bin/env bash
# Soak test for TRAWL — repeatable perf measurement for browser-pool changes.
#
# Builds the image from the current HEAD, starts a container on an isolated port
# (default 8192), runs N forced Tier 3 scrapes to a configurable target URL while
# sampling thread/process/CPU/MEM every 2 seconds, then prints a summary table.
#
# Usage:
#   scripts/soak-test.sh                              # defaults: 25 scrapes, eztvx.to, port 8192
#   SCRAPES=50 TARGET=https://nopecha.com/demo/cloudflare scripts/soak-test.sh
#   POOL_SIZE=1 RECYCLE_AFTER=8 CONTENT_PROCS=2 scripts/soak-test.sh
#
# Outputs:
#   - Console table with p50/p95/p99 latencies, 429 count, thread/process peaks
#   - /tmp/soak/<scenario>/latencies.txt   — per-request timing
#   - /tmp/soak/<scenario>/metrics.csv     — sampled thread/proc/CPU/MEM every 2s
#
# Exit codes:
#   0 = soak ran to completion (regardless of 429 count, see below)
#   1 = container failed to start healthy
#   2 = build failed

set -uo pipefail

SCRAPES=${SCRAPES:-25}
TARGET=${TARGET:-https://eztvx.to/home}
PORT=${PORT:-8192}
POOL_SIZE=${POOL_SIZE:-1}
RECYCLE_AFTER=${RECYCLE_AFTER:-8}
CONTENT_PROCS=${CONTENT_PROCS:-2}
GITHUB_TOKEN=${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || echo "")}

SCENARIO="${POOL_SIZE}p-r${RECYCLE_AFTER}-c${CONTENT_PROCS}"
OUT_DIR="/tmp/soak/${SCENARIO}"
CONTAINER_NAME="trawl-soak-${SCENARIO}"
IMAGE_TAG="trawl:soak-${SCENARIO}"

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/metrics.csv" "$OUT_DIR/latencies.txt"

echo "=== Soak test scenario ==="
echo "  scrapes:        $SCRAPES"
echo "  target:         $TARGET"
echo "  port:           $PORT"
echo "  pool_size:      $POOL_SIZE"
echo "  recycle_after:  $RECYCLE_AFTER"
echo "  content_procs:  $CONTENT_PROCS"
echo "  container:      $CONTAINER_NAME"
echo "  output:         $OUT_DIR"
echo

# 1. Build image
echo "=== Building image ==="
if ! DOCKER_BUILDKIT=1 docker build \
  -f apps/api/Dockerfile \
  -t "$IMAGE_TAG" \
  --secret id=GITHUB_TOKEN,env=GITHUB_TOKEN \
  . > "$OUT_DIR/build.log" 2>&1; then
  echo "BUILD FAILED — see $OUT_DIR/build.log"
  exit 2
fi
echo "  built: $IMAGE_TAG"

# 2. Clean previous run
docker rm -f "$CONTAINER_NAME" 2>/dev/null

# 3. Start container
echo "=== Starting container ==="
docker run -d \
  --name "$CONTAINER_NAME" \
  --rm \
  -p "${PORT}:8191" \
  --shm-size=1gb \
  -e "BROWSER_POOL_SIZE=${POOL_SIZE}" \
  -e "BROWSER_RECYCLE_AFTER_CONTEXTS=${RECYCLE_AFTER}" \
  -e "BROWSER_CONTENT_PROCESSES=${CONTENT_PROCS}" \
  "$IMAGE_TAG" > /dev/null

# 4. Wait for healthy
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/health" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    echo "  healthy after $((i*2))s"
    break
  fi
  sleep 2
done

if [[ "$code" != "200" ]]; then
  echo "CONTAINER FAILED TO BECOME HEALTHY"
  docker logs --tail 50 "$CONTAINER_NAME"
  exit 1
fi

# 5. Capture baseline metrics
echo "=== Baseline ==="
baseline_threads=$(docker exec "$CONTAINER_NAME" ps -eLf 2>/dev/null | wc -l)
baseline_procs=$(docker exec "$CONTAINER_NAME" ps -ef 2>/dev/null | wc -l)
echo "  threads: $baseline_threads"
echo "  procs:   $baseline_procs"
echo

# 6. Start metrics sampler in background
(
  while true; do
    ts=$(date +%s.%N)
    threads=$(docker exec "$CONTAINER_NAME" ps -eLf 2>/dev/null | wc -l)
    procs=$(docker exec "$CONTAINER_NAME" ps -ef 2>/dev/null | wc -l)
    cpu_mem=$(docker stats "$CONTAINER_NAME" --no-stream --format '{{.CPUPerc}} {{.MemUsage}}' 2>/dev/null || echo "N/A")
    restarts=$(curl -s "http://localhost:${PORT}/health" 2>/dev/null \
      | python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["pool"]["restarts"])' 2>/dev/null || echo "err")
    echo "$ts,$threads,$procs,$cpu_mem,$restarts" >> "$OUT_DIR/metrics.csv"
    sleep 2
  done
) &
SAMPLER_PID=$!

sleep 2

# 7. Run scrapes
echo "=== Running $SCRAPES scrapes ==="
for i in $(seq 1 "$SCRAPES"); do
  start=$(date +%s.%N)
  resp=$(curl -s --max-time 90 -X POST "http://localhost:${PORT}/scrape" \
    -H 'content-type: application/json' \
    --data "{\"url\":\"$TARGET\",\"skipHttp\":true,\"maxTier\":3,\"maxTimeout\":60000}" 2>/dev/null)
  end=$(date +%s.%N)
  elapsed=$(echo "$end - $start" | bc)

  http_code=$(echo "$resp" | python3 -c '
import json,sys
try:
    d=json.loads(sys.stdin.read(), strict=False)
    # /scrape returns tier+status on success, status:error envelope on 429
    if "status" in d and d["status"] == "error":
        print("429")
    else:
        print("200")
except Exception:
    print("err")
' 2>/dev/null || echo "err")

  echo "$i elapsed=${elapsed}s code=$http_code" | tee -a "$OUT_DIR/latencies.txt"
  sleep 1
done
echo

sleep 3
kill $SAMPLER_PID 2>/dev/null

# 8. Capture final state
echo "=== Final state ==="
final_health=$(curl -s "http://localhost:${PORT}/health")
echo "  $final_health"
final_threads=$(docker exec "$CONTAINER_NAME" ps -eLf 2>/dev/null | wc -l)
echo "  threads: $final_threads"
echo

# 9. Summary
echo "=== Summary ==="
python3 << EOF
import re, csv

# Latencies
lats = []
with open("$OUT_DIR/latencies.txt") as f:
    for line in f:
        m = re.search(r"elapsed=([\d.]+)s\s+code=(\S+)", line)
        if m:
            lats.append((float(m.group(1)), m.group(2)))

if not lats:
    print("  no requests completed")
else:
    sorted_lats = sorted(l for l, _ in lats)
    n = len(sorted_lats)
    code_counts = {}
    for _, c in lats:
        code_counts[c] = code_counts.get(c, 0) + 1
    def pct(p):
        return sorted_lats[min(int(n * p), n-1)]
    fail = sum(1 for _, c in lats if c != "200")
    print(f"  requests:      {n} ({fail} non-200, {100*fail/n:.0f}%)")
    print(f"  code counts:   {code_counts}")
    print(f"  latency min:   {sorted_lats[0]:.2f}s")
    print(f"  latency p50:   {pct(0.50):.2f}s")
    print(f"  latency p95:   {pct(0.95):.2f}s")
    print(f"  latency p99:   {pct(0.99):.2f}s")
    print(f"  latency max:   {sorted_lats[-1]:.2f}s")
    print(f"  latency avg:   {sum(sorted_lats)/n:.2f}s")

# Metrics
with open("$OUT_DIR/metrics.csv") as f:
    rows = list(csv.reader(f))
threads = [int(r[1]) for r in rows if len(r) > 1]
procs = [int(r[2]) for r in rows if len(r) > 2]
restarts = [int(r[4]) for r in rows if len(r) > 4 and r[4].isdigit()]
if threads:
    print(f"  threads:       first={threads[0]}, min={min(threads)}, max={max(threads)}, last={threads[-1]}")
if procs:
    print(f"  procs:         first={procs[0]}, min={min(procs)}, max={max(procs)}, last={procs[-1]}")
if restarts:
    print(f"  restarts:      max={max(restarts)}")
EOF

# 10. Cleanup container (image stays)
echo
echo "=== Cleanup ==="
docker stop "$CONTAINER_NAME" 2>&1 | tail -2
echo "  image kept: $IMAGE_TAG (delete with: docker rmi $IMAGE_TAG)"