<script lang="ts" setup>
const features = [
  {
    icon: "⬡",
    title: "Adaptive Tier Engine",
    badge: "unique",
    featured: true,
    desc: "Every request takes the cheapest path first — plain HTTP, then cached session, then live browser solve, then residential proxy. You pay the full browser cost only when you have to.",
  },
  {
    icon: "◈",
    title: "Camoufox Firefox",
    badge: "stealthy",
    featured: true,
    desc: "Powered by Camoufox — a hardened Firefox build that patches fingerprints at the C++ level. Cloudflare's bot score sees a real user. No CDP leaks. No Chrome fingerprint flags.",
  },
  {
    icon: "⟁",
    title: "Cloudflare Bypass",
    desc: "Fresh browser context triggers CF managed-mode evaluation — solves in 4–15s vs 11–18s with alternatives. Cookies are extracted and cached immediately after the first solve.",
  },
  {
    icon: "⬢",
    title: "Captcha Suite",
    badge: "auto",
    desc: "Turnstile via shadow DOM click, reCAPTCHA v2 via Google's free audio STT, hCaptcha auto-pass, and GeeTest v4 slide via canvas gap detection. No external solver APIs. No cost per solve.",
  },
  {
    icon: "◎",
    title: "Session Cache",
    desc: "Cloudflare cookies are stored in Redis per domain after every successful solve. The next request returns in under 500ms — zero re-challenge. 1-hour TTL, automatically refreshed.",
  },
  {
    icon: "▣",
    title: "Persistent Pool",
    desc: "N browser instances stay warm and ready at all times. A request picks up a browser in ~50ms instead of waiting 3–5 seconds for a cold launch. Domain-sticky routing maximises session reuse.",
  },
  {
    icon: "↝",
    title: "Proxy Escalation",
    desc: "Datacenter IP for Tier 3 solves, residential proxy for Tier 4. Escalates automatically when an IP is reputation-flagged. Residential bandwidth is only consumed when truly needed.",
  },
  {
    icon: "⟳",
    title: "FlareSolverr Compatible",
    desc: "Implements the FlareSolverr v2 API exactly — including response shape, cookie format, and version string. Prowlarr, Jackett, Sonarr, and Radarr connect with a single URL change.",
  },
  {
    icon: "⊕",
    title: "Custom Headers",
    desc: "Pass Authorization, Referer, Origin, or any header to the target. Forwarded through all four tiers — including CF challenge solving — via scoped route interception that never leaks to subresources or challenge endpoints.",
  },
]
</script>

<template>
  <section id="features" class="section">
    <div class="container">
      <p class="eyebrow">capabilities</p>
      <h2 class="section-title">built for the modern web.</h2>
      <p class="section-sub">Every protection layer. Every captcha type. One API. Nothing hosted externally.</p>

      <div class="features-grid">
        <div
          v-for="(f, i) in features"
          :key="f.title"
          v-motion
          :initial="{ opacity: 0, y: 24 }"
          :visible-once="{ opacity: 1, y: 0, transition: { delay: i * 50, duration: 400 } }"
          class="feature-card"
          :class="{ featured: f.featured }"
        >
          <div class="feature-icon">{{ f.icon }}</div>
          <div class="feature-body">
            <h3 class="feature-title">
              {{ f.title }}
              <span v-if="f.badge" class="feature-badge">{{ f.badge }}</span>
            </h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 12px;
}

.section-sub {
  font-size: 13px;
  line-height: 1.75;
  color: var(--text-muted);
  max-width: 500px;
  margin-bottom: 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
}

.feature-card {
  background: var(--bg);
  padding: 32px 28px;
  display: flex;
  gap: 18px;
  transition:
    background 0.15s,
    border-color 0.15s;
  border: 1px solid transparent;
  position: relative;
}

.feature-card:hover {
  background: var(--accent-tint);
  border-color: var(--accent);
  z-index: 1;
}

.feature-card.featured::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
}

.feature-icon {
  font-size: 16px;
  color: var(--accent);
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-badge {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 6px;
  background: var(--accent-tint);
  color: var(--accent);
  border: 1px solid var(--accent);
}

.feature-desc {
  font-size: 12px;
  line-height: 1.75;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  .feature-card {
    padding: 24px 20px;
  }
}
</style>
