export default defineNuxtConfig({
  compatibilityDate: "2026-06-23",

  modules: ["@nuxt/fonts", "@nuxtjs/color-mode", "@nuxtjs/seo", "@vueuse/motion/nuxt"],

  colorMode: {
    classSuffix: "",
    fallback: "dark",
    preference: "dark",
  },

  fonts: {
    families: [
      {
        name: "Geist Mono",
        provider: "google",
        weights: ["300", "400", "500", "600", "700"],
      },
    ],
  },

  site: {
    url: "https://trawl.dev",
    name: "TRAWL",
    description:
      "Self-hosted web scraping engine with adaptive tier execution. Solves Cloudflare challenges natively in 4–15s. Returns cached results in under 500ms. Drop-in FlareSolverr replacement for Prowlarr, Jackett, Sonarr, and Radarr.",
    defaultLocale: "en",
  },

  app: {
    head: {
      title: "TRAWL — Adaptive Web Scraping Engine",
      templateParams: {
        siteName: "TRAWL",
        separator: "—",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#00e87a" },
        { name: "robots", content: "index, follow" },
        {
          name: "keywords",
          content:
            "cloudflare bypass, web scraping, flaresolver replacement, self-hosted scraper, browser automation, captcha solver, prowlarr, jackett, *arr",
        },
        { property: "og:type", content: "website" },
        {
          property: "og:title",
          content: "TRAWL — Adaptive Web Scraping Engine",
        },
        {
          property: "og:description",
          content:
            "Solve Cloudflare challenges natively. Return cached results in <500ms. Self-hosted, zero external APIs, FlareSolverr-compatible.",
        },
        { property: "og:url", content: "https://trawl.dev" },
        { name: "twitter:card", content: "summary" },
        {
          name: "twitter:title",
          content: "TRAWL — Adaptive Web Scraping Engine",
        },
        {
          name: "twitter:description",
          content:
            "Self-hosted scraping engine. Cloudflare bypass, captcha solving, session caching. Drop-in FlareSolverr replacement.",
        },
      ],
      link: [
        { rel: "canonical", href: "https://trawl.dev" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    },
  },
})
