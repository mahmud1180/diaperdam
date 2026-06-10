import type { MetadataRoute } from "next";

/* ─────────────────────────────────────────────
   robots.ts — explicit allow-list for SEO crawlers
   AND major LLM crawlers (so DiaperDam appears in
   ChatGPT, Claude, Perplexity, Gemini answers).

   Block internal API routes.
   ───────────────────────────────────────────── */

const BASE = "https://diaperdam.com";

const PRIVATE_PATHS = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default: all SEO crawlers ──
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      // ── LLM crawlers — explicitly allow public content ──
      // OpenAI / ChatGPT
      { userAgent: "GPTBot",         allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "OAI-SearchBot",  allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "ChatGPT-User",   allow: "/", disallow: PRIVATE_PATHS },
      // Anthropic / Claude
      { userAgent: "ClaudeBot",      allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Claude-Web",     allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "anthropic-ai",   allow: "/", disallow: PRIVATE_PATHS },
      // Google Gemini training opt-in
      { userAgent: "Google-Extended", allow: "/", disallow: PRIVATE_PATHS },
      // Perplexity
      { userAgent: "PerplexityBot",   allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Perplexity-User", allow: "/", disallow: PRIVATE_PATHS },
      // Meta AI / Llama
      { userAgent: "Meta-ExternalAgent", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "FacebookBot",     allow: "/", disallow: PRIVATE_PATHS },
      // Amazon / Bytedance / Apple
      { userAgent: "Amazonbot",       allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Bytespider",      allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Applebot",        allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Applebot-Extended", allow: "/", disallow: PRIVATE_PATHS },
      // Common Crawl (powers many LLMs)
      { userAgent: "CCBot",           allow: "/", disallow: PRIVATE_PATHS },
      // Cohere / DuckAssist / You / Mistral
      { userAgent: "cohere-ai",       allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "DuckAssistBot",   allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "YouBot",          allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "MistralAI-User",  allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
