<script lang="ts" setup>
type Tab = "curl" | "js" | "python" | "prowlarr"
const active = shallowRef<Tab>("curl")

const tabs: { id: Tab; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "js", label: "javascript" },
  { id: "python", label: "python" },
  { id: "prowlarr", label: "prowlarr" },
]

const code: Record<Tab, string> = {
  curl: `<span class="c"># FlareSolverr-compatible endpoint (always open — *arr compatible)</span>
curl -s -X POST http://localhost:8191/v1 \\
  -H <span class="s">"Content-Type: application/json"</span> \\
  -d <span class="s">'{
    "cmd": "request.get",
    "url": "https://nowsecure.nl",
    "maxTimeout": 60000
  }'</span> | jq <span class="s">'.solution.response'</span>

<span class="c"># Native API — richer response with tier, timings, sessionCached</span>
curl -s -X POST http://localhost:8191/scrape \\
  -H <span class="s">"Content-Type: application/json"</span> \\
  -d <span class="s">'{"url":"https://nowsecure.nl"}'</span> | jq <span class="s">'{tier,totalMs}'</span>`,

  js: `<span class="c">// FlareSolverr-compatible endpoint</span>
<span class="kw">const</span> res = <span class="kw">await</span> fetch(<span class="s">"http://localhost:8191/v1"</span>, {
  method: <span class="s">"POST"</span>,
  headers: { <span class="s">"Content-Type"</span>: <span class="s">"application/json"</span> },
  body: JSON.stringify({
    cmd: <span class="s">"request.get"</span>,
    url: <span class="s">"https://nowsecure.nl"</span>,
    maxTimeout: <span class="n">60000</span>,
  }),
})

<span class="kw">const</span> { solution } = <span class="kw">await</span> res.json()

console.log(solution.response)  <span class="c">// full HTML</span>
console.log(solution.cookies)   <span class="c">// Cloudflare cookies</span>
console.log(solution.userAgent) <span class="c">// browser UA used</span>`,

  python: `<span class="kw">import</span> requests

<span class="c"># FlareSolverr-compatible endpoint</span>
res = requests.post(<span class="s">"http://localhost:8191/v1"</span>, json={
    <span class="s">"cmd"</span>: <span class="s">"request.get"</span>,
    <span class="s">"url"</span>: <span class="s">"https://nowsecure.nl"</span>,
    <span class="s">"maxTimeout"</span>: <span class="n">60000</span>,
}, timeout=<span class="n">65</span>)

data = res.json()
assert data[<span class="s">"status"</span>] == <span class="s">"ok"</span>

html    = data[<span class="s">"solution"</span>][<span class="s">"response"</span>]
cookies = data[<span class="s">"solution"</span>][<span class="s">"cookies"</span>]`,

  prowlarr: `<span class="c"># Prowlarr → Settings → Indexers → FlareSolverr</span>
<span class="c"># Paste one of these into the FlareSolverr URL field:</span>

<span class="c"># running on this machine:</span>
<span class="s">http://localhost:8191</span>

<span class="c"># running in Docker alongside Prowlarr:</span>
<span class="s">http://trawl:8191</span>

<span class="c"># TRAWL implements the v2 API exactly — no other changes needed.</span>`,
}
</script>

<template>
  <section id="usage" class="section">
    <div class="container">
      <p class="eyebrow">API usage</p>
      <h2 class="section-title">works with everything.</h2>

      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :visible-once="{ opacity: 1, y: 0, transition: { duration: 400 } }"
        class="code-block"
      >
        <div class="tabs">
          <button
            type="button"
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: active === tab.id }"
            @click="active = tab.id"
          >
            {{ tab.label }}
          </button>
          <div class="tab-spacer" />
          <span class="tab-hint">POST /v1 · FlareSolverr v2 compat</span>
        </div>
        <pre class="code-body"><code v-html="code[active]" /></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 32px;
}

.code-block {
  border: 1px solid var(--border);
  overflow: hidden;
}

.tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
  overflow-x: auto;
}

.tab {
  padding: 10px 18px;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-right: 1px solid var(--border);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
}

.tab:hover {
  color: var(--text);
  background: var(--bg);
}

.tab.active {
  color: var(--accent);
  background: var(--accent-tint);
  border-bottom: 1px solid var(--accent);
}

.tab-spacer {
  flex: 1;
}

.tab-hint {
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--border-strong);
  padding: 0 16px;
  white-space: nowrap;
}

.code-body {
  margin: 0;
  padding: 28px 32px;
  overflow-x: auto;
  background: var(--bg);
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-muted);
}

.code-body :deep(.kw) {
  color: #a78bfa;
}
.code-body :deep(.s) {
  color: #86efac;
}
.code-body :deep(.n) {
  color: #fb923c;
}
.code-body :deep(.c) {
  color: var(--border-strong);
  font-style: italic;
}

@media (max-width: 600px) {
  .code-body {
    padding: 20px;
    font-size: 12px;
  }
}
</style>
