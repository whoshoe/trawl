// Rotating proxy pool backed by a continuously updated free proxy list.
// Proxies are fetched once per TTL and returned round-robin.
// These are datacenter proxies — useful for IP rotation on non-CF sites but
// unlikely to help against Cloudflare's managed/Turnstile challenges alone.

const PROXY_LIST_URL = "https://raw.githubusercontent.com/theriturajps/proxy-list/refs/heads/main/proxies.json"

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

interface ProxyCache {
  proxies: string[]
  fetchedAt: number
}

let cache: ProxyCache | null = null
let cursor = 0

async function fetchProxyList(): Promise<string[]> {
  try {
    const res = await fetch(PROXY_LIST_URL, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { proxies?: string[] } | string[]
    // Handle both { proxies: [...] } object and bare array formats
    const raw: string[] = Array.isArray(json) ? json : ((json as { proxies?: string[] }).proxies ?? [])
    // Filter out obviously invalid entries (0.0.0.0, private ranges)
    return raw.filter((p) => {
      if (!p || typeof p !== "string") return false
      const ip = p.split(":")[0]
      if (!ip || ip === "0.0.0.0") return false
      if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) return false
      return true
    })
  } catch (err) {
    console.warn("[proxy] failed to fetch proxy list:", err instanceof Error ? err.message : err)
    return []
  }
}

async function getProxies(): Promise<string[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS && cache.proxies.length > 0) {
    return cache.proxies
  }
  const proxies = await fetchProxyList()
  if (proxies.length > 0) {
    cache = { proxies, fetchedAt: Date.now() }
    cursor = 0
    console.log(`[proxy] loaded ${proxies.length} proxies`)
  }
  return proxies
}

// Returns the next proxy in rotation as "http://IP:PORT", or null if unavailable.
export async function getNextProxy(): Promise<string | null> {
  const proxies = await getProxies()
  if (proxies.length === 0) return null
  const proxy = proxies[cursor % proxies.length]
  cursor = (cursor + 1) % proxies.length
  return `http://${proxy}`
}

// Returns a random proxy from the pool (useful for parallel requests).
export async function getRandomProxy(): Promise<string | null> {
  const proxies = await getProxies()
  if (proxies.length === 0) return null
  const idx = Math.floor(Math.random() * proxies.length)
  return `http://${proxies[idx]}`
}

export function clearProxyCache(): void {
  cache = null
  cursor = 0
}
