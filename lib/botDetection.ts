/**
 * Enhanced bot detection and classification
 * Identifies AI agents, crawlers, and other automated traffic
 */

export type BotClassification = {
  isBot: boolean
  botType: string | null
  botName: string | null
}

// AI Scrapers and LLM bots
const AI_SCRAPERS = [
  { pattern: /GPTBot/i, name: 'GPTBot', type: 'ai-scraper' },
  { pattern: /ChatGPT-User/i, name: 'ChatGPT', type: 'ai-scraper' },
  { pattern: /ClaudeBot/i, name: 'ClaudeBot', type: 'ai-scraper' },
  { pattern: /Claude-Web/i, name: 'Claude', type: 'ai-scraper' },
  { pattern: /anthropic-ai/i, name: 'Anthropic-AI', type: 'ai-scraper' },
  { pattern: /Google-Extended/i, name: 'Google-Extended', type: 'ai-scraper' },
  { pattern: /PerplexityBot/i, name: 'PerplexityBot', type: 'ai-scraper' },
  { pattern: /YouBot/i, name: 'YouBot', type: 'ai-scraper' },
  { pattern: /Bytespider/i, name: 'Bytespider', type: 'ai-scraper' }, // TikTok
  { pattern: /Diffbot/i, name: 'Diffbot', type: 'ai-scraper' },
  { pattern: /AI2Bot/i, name: 'AI2Bot', type: 'ai-scraper' },
  { pattern: /FacebookBot/i, name: 'FacebookBot', type: 'ai-scraper' },
  {
    pattern: /Meta-ExternalAgent/i,
    name: 'Meta-ExternalAgent',
    type: 'ai-scraper',
  },
  { pattern: /OAI-SearchBot/i, name: 'OpenAI-SearchBot', type: 'ai-scraper' },
]

// Search engine crawlers
const SEARCH_CRAWLERS = [
  { pattern: /Googlebot/i, name: 'Googlebot', type: 'search-crawler' },
  { pattern: /bingbot/i, name: 'Bingbot', type: 'search-crawler' },
  { pattern: /Slurp/i, name: 'Yahoo Slurp', type: 'search-crawler' },
  { pattern: /DuckDuckBot/i, name: 'DuckDuckBot', type: 'search-crawler' },
  { pattern: /Baiduspider/i, name: 'Baiduspider', type: 'search-crawler' },
  { pattern: /YandexBot/i, name: 'YandexBot', type: 'search-crawler' },
  { pattern: /Sogou/i, name: 'Sogou', type: 'search-crawler' },
  { pattern: /Exabot/i, name: 'Exabot', type: 'search-crawler' },
]

// SEO and monitoring tools
const SEO_TOOLS = [
  { pattern: /SemrushBot/i, name: 'SemrushBot', type: 'seo-tool' },
  { pattern: /AhrefsBot/i, name: 'AhrefsBot', type: 'seo-tool' },
  { pattern: /MJ12bot/i, name: 'MJ12bot', type: 'seo-tool' },
  { pattern: /DotBot/i, name: 'DotBot', type: 'seo-tool' },
  { pattern: /Screaming Frog/i, name: 'Screaming Frog', type: 'seo-tool' },
  { pattern: /SEOkicks/i, name: 'SEOkicks', type: 'seo-tool' },
]

// Social media crawlers
const SOCIAL_CRAWLERS = [
  { pattern: /Twitterbot/i, name: 'Twitterbot', type: 'social-media' },
  { pattern: /LinkedInBot/i, name: 'LinkedInBot', type: 'social-media' },
  { pattern: /Pinterestbot/i, name: 'Pinterestbot', type: 'social-media' },
  { pattern: /Discordbot/i, name: 'Discordbot', type: 'social-media' },
  { pattern: /TelegramBot/i, name: 'TelegramBot', type: 'social-media' },
  { pattern: /Slackbot/i, name: 'Slackbot', type: 'social-media' },
  { pattern: /WhatsApp/i, name: 'WhatsApp', type: 'social-media' },
]

// Monitoring and uptime checkers
const MONITORING_BOTS = [
  { pattern: /UptimeRobot/i, name: 'UptimeRobot', type: 'monitoring' },
  { pattern: /Pingdom/i, name: 'Pingdom', type: 'monitoring' },
  { pattern: /StatusCake/i, name: 'StatusCake', type: 'monitoring' },
  { pattern: /Site24x7/i, name: 'Site24x7', type: 'monitoring' },
  { pattern: /Datadog/i, name: 'Datadog', type: 'monitoring' },
]

// Generic bot patterns (fallback)
const GENERIC_BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /http/i,
]

/**
 * Classify a user agent string to determine if it's a bot and what type
 */
export function classifyBot(userAgent: string): BotClassification {
  if (!userAgent || userAgent.trim() === '') {
    return { isBot: false, botType: null, botName: null }
  }

  // Check AI scrapers first (highest priority)
  for (const bot of AI_SCRAPERS) {
    if (bot.pattern.test(userAgent)) {
      return { isBot: true, botType: bot.type, botName: bot.name }
    }
  }

  // Check search crawlers
  for (const bot of SEARCH_CRAWLERS) {
    if (bot.pattern.test(userAgent)) {
      return { isBot: true, botType: bot.type, botName: bot.name }
    }
  }

  // Check SEO tools
  for (const bot of SEO_TOOLS) {
    if (bot.pattern.test(userAgent)) {
      return { isBot: true, botType: bot.type, botName: bot.name }
    }
  }

  // Check social media crawlers
  for (const bot of SOCIAL_CRAWLERS) {
    if (bot.pattern.test(userAgent)) {
      return { isBot: true, botType: bot.type, botName: bot.name }
    }
  }

  // Check monitoring bots
  for (const bot of MONITORING_BOTS) {
    if (bot.pattern.test(userAgent)) {
      return { isBot: true, botType: bot.type, botName: bot.name }
    }
  }

  // Check generic bot patterns
  for (const pattern of GENERIC_BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, botType: 'other', botName: null }
    }
  }

  // Not a bot
  return { isBot: false, botType: null, botName: null }
}

/**
 * Get a human-readable description of a bot type
 */
export function getBotTypeDescription(botType: string | null): string {
  if (!botType) return 'Unknown'

  const descriptions: Record<string, string> = {
    'ai-scraper': 'AI Scraper / LLM Bot',
    'search-crawler': 'Search Engine Crawler',
    'seo-tool': 'SEO Tool',
    'social-media': 'Social Media Bot',
    monitoring: 'Monitoring Service',
    other: 'Other Bot',
  }

  return descriptions[botType] || botType
}
