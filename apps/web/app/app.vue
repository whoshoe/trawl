<script lang="ts" setup>
useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "TRAWL",
        url: "https://trawl.dev",
        description:
          "Self-hosted web scraping engine with adaptive tier execution. Solves Cloudflare challenges natively. Drop-in FlareSolverr replacement.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Linux, Docker",
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        author: { "@type": "Person", name: "germondai", url: "https://github.com/germondai" },
        codeRepository: "https://github.com/germondai/trawl",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }),
    },
  ],
})
</script>

<template>
  <div class="layout">
    <NavBar />
    <main>
      <HeroSection />
      <EcosystemBanner />
      <StatsBar />
      <FeaturesGrid />
      <ChallengeGrid />
      <TierFlow />
      <CompareTable />
      <CtaSection />
      <CodeExample />
    </main>
    <FooterBar />
    <FloatingButtons />
  </div>
</template>

<style>
/* ── CSS custom properties ── */
:root {
  --bg: #fafafa;
  --bg-subtle: #f4f4f5;
  --surface: #ffffff;
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  --text: #09090b;
  --text-muted: #71717a;
  --accent: #00b85e;
  --accent-tint: rgba(0, 184, 94, 0.08);
  --accent-glow: rgba(0, 184, 94, 0.25);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.dark {
  --bg: #0d0d10;
  --bg-subtle: #17171b;
  --surface: #1c1c21;
  --border: #2a2a30;
  --border-strong: #404048;
  --text: #f0f0f2;
  --text-muted: #9898a6;
  --accent: #00e87a;
  --accent-tint: rgba(0, 232, 122, 0.09);
  --accent-glow: rgba(0, 232, 122, 0.22);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* ── Base reset ── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background: var(--bg);
  color: var(--text);
  font-family: "Geist Mono", "JetBrains Mono", "Fira Code", ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  scroll-behavior: smooth;
  transition:
    background 0.2s,
    color 0.2s;
}

body {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}
button {
  font-family: inherit;
  cursor: pointer;
}
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: inherit;
  margin: 0;
}
pre,
code {
  font-family: inherit;
}
img {
  display: block;
  max-width: 100%;
}
p {
  margin: 0;
}

/* ── Layout ── */
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main {
  flex: 1;
  padding-top: 60px;
}

/* ── Shared section wrapper ── */
.section {
  padding: 80px 0;
  border-top: 1px solid var(--border);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── Section label ── */
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 32px;
}

/* ── Accent highlight ── */
.accent {
  color: var(--accent);
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent);
  color: #080808;
  border-color: var(--accent);
}
.btn-primary:hover {
  opacity: 0.88;
}

.btn-outline {
  background: transparent;
  color: var(--text);
  border-color: var(--border-strong);
}
.btn-outline:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Page transition ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* ── Mobile globals ── */
@media (max-width: 640px) {
  .section {
    padding: 48px 0;
  }
  .container {
    padding: 0 16px;
  }
  .eyebrow {
    margin-bottom: 20px;
  }
}

/* ── Scrollbar ── */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg);
}
::-webkit-scrollbar-thumb {
  background: var(--border-strong);
}
</style>
