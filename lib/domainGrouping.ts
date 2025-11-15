/**
 * Intelligent Domain Grouping Algorithm
 *
 * Groups preview deployments with their base domains using heuristic analysis
 * instead of hardcoded patterns. Works across multiple deployment platforms
 * (Vercel, Cloudflare Pages, etc.)
 */

export interface DomainAnalysis {
  original: string
  projectTokens: string[]
  isPreview: boolean
  confidence: number
  canonical: string
}

/**
 * Identifies tokens that are likely ephemeral (deployment-specific)
 */
function isEphemeralToken(
  token: string,
  index: number,
  allTokens: string[]
): boolean {
  // Empty token
  if (!token || token.length === 0) return true

  // Git branch markers
  if (token === 'git') return true
  if (index > 0 && allTokens[index - 1] === 'git') return true

  // Hex hashes (8+ characters)
  if (/^[a-f0-9]{8,}$/i.test(token)) return true

  // Long random-looking strings (likely deployment IDs)
  if (token.length >= 9 && /^[a-z0-9]{9,}$/i.test(token)) {
    // But exclude common words
    if (
      /^(master|main|develop|dev|prod|production|staging|test)$/i.test(token)
    ) {
      return false
    }
    return true
  }

  // UUID-like patterns (very long alphanumeric)
  if (token.length > 15 && /^[a-z0-9]+$/i.test(token)) return true

  // Deployment-specific prefixes (observed patterns)
  if (token.startsWith('claude-') || token.startsWith('011c')) return true

  // Short random-looking codes (like "il3r78fte")
  if (token.length >= 6 && token.length <= 12 && /^[a-z0-9]+$/i.test(token)) {
    // Check if it's "too random" - has varied character distribution
    const uniqueChars = new Set(token.split('')).size
    if (uniqueChars >= token.length * 0.6) return true
  }

  return false
}

/**
 * Analyzes a domain and extracts its meaningful components
 */
export function analyzeDomain(domain: string): DomainAnalysis {
  const parts = domain.split('.')
  const subdomain = parts[0] || ''
  const tld = parts.slice(1).join('.')

  // Cloudflare Pages: [hash].project.pages.dev
  if (tld.endsWith('.pages.dev')) {
    const hashMatch = subdomain.match(/^([a-f0-9]{8})$/i)
    if (hashMatch) {
      const baseDomain = tld.replace('.pages.dev', '')
      return {
        original: domain,
        projectTokens: baseDomain.split('-'),
        isPreview: true,
        confidence: 1.0,
        canonical: tld,
      }
    }
  }

  // Tokenize subdomain
  const tokens = subdomain.split('-').filter((t) => t.length > 0)

  // Filter out ephemeral tokens to get project tokens
  const projectTokens = tokens.filter(
    (token, index) => !isEphemeralToken(token, index, tokens)
  )

  // Determine if this is a preview deployment
  const isPreview =
    tokens.length !== projectTokens.length || // Has ephemeral tokens
    tld === 'vercel.app' || // Vercel deployments
    tld.endsWith('.pages.dev') // Cloudflare Pages

  // Calculate confidence based on how many tokens we filtered
  const confidence =
    projectTokens.length > 0 ? projectTokens.length / tokens.length : 0.5

  // Build canonical domain
  let canonical = domain
  if (projectTokens.length > 0) {
    canonical = `${projectTokens.join('-')}.${tld}`
  }

  return {
    original: domain,
    projectTokens,
    isPreview,
    confidence,
    canonical,
  }
}

/**
 * Calculates similarity score between two domain analyses (0-1)
 */
function calculateSimilarity(a: DomainAnalysis, b: DomainAnalysis): number {
  // Same canonical domain = perfect match
  if (a.canonical === b.canonical) return 1.0

  // Calculate token overlap (Jaccard similarity)
  const tokensA = new Set(a.projectTokens)
  const tokensB = new Set(b.projectTokens)

  const tokensAArray = Array.from(tokensA)
  const intersection = new Set(
    tokensAArray.filter((token) => tokensB.has(token))
  )
  const union = new Set([...tokensAArray, ...Array.from(tokensB)])

  if (union.size === 0) return 0

  const jaccardSimilarity = intersection.size / union.size

  // Boost score if both domains share TLD
  const tldA = a.original.split('.').slice(1).join('.')
  const tldB = b.original.split('.').slice(1).join('.')
  const tldBonus = tldA === tldB ? 0.2 : 0

  return Math.min(1.0, jaccardSimilarity + tldBonus)
}

/**
 * Groups domains by similarity
 * Returns map of canonical domain -> all related domains
 */
export function groupDomains(domains: string[]): Map<string, string[]> {
  const analyses = domains.map(analyzeDomain)
  const groups = new Map<string, string[]>()

  // First pass: group by exact canonical match
  const canonicalMap = new Map<string, DomainAnalysis[]>()
  for (const analysis of analyses) {
    const key = analysis.canonical
    if (!canonicalMap.has(key)) {
      canonicalMap.set(key, [])
    }
    canonicalMap.get(key)!.push(analysis)
  }

  // Second pass: merge similar groups
  const processed = new Set<string>()
  const finalGroups = new Map<string, Set<string>>()

  const canonicalEntries = Array.from(canonicalMap.entries())
  for (const [canonical, group] of canonicalEntries) {
    if (processed.has(canonical)) continue

    const mergedGroup = new Set(group.map((a: DomainAnalysis) => a.original))
    processed.add(canonical)

    // Find similar groups to merge
    const otherEntries = Array.from(canonicalMap.entries())
    for (const [otherCanonical, otherGroup] of otherEntries) {
      if (processed.has(otherCanonical)) continue

      // Calculate similarity between groups
      const similarity = calculateSimilarity(group[0], otherGroup[0])

      if (similarity >= 0.6) {
        // Threshold for grouping
        otherGroup.forEach((a: DomainAnalysis) => mergedGroup.add(a.original))
        processed.add(otherCanonical)
      }
    }

    // Choose best canonical domain (prefer production, then shortest)
    const groupDomains = Array.from(mergedGroup)
    const productionDomain = groupDomains.find(
      (d: string) => !d.includes('vercel.app') && !d.includes('.pages.dev')
    )
    const bestCanonical =
      productionDomain ||
      groupDomains.sort((a: string, b: string) => a.length - b.length)[0]

    finalGroups.set(bestCanonical, mergedGroup)
  }

  // Convert to final format
  const finalEntries = Array.from(finalGroups.entries())
  for (const [canonical, domains] of finalEntries) {
    groups.set(canonical, Array.from(domains).sort())
  }

  return groups
}

/**
 * Determines if a domain is a preview deployment
 */
export function isPreviewDomain(domain: string): boolean {
  const analysis = analyzeDomain(domain)
  return analysis.isPreview
}

/**
 * Gets the canonical (base) domain for a given domain
 */
export function getCanonicalDomain(domain: string): string {
  const analysis = analyzeDomain(domain)
  return analysis.canonical
}

/**
 * Counts preview deployments for a base domain
 */
export function countPreviews(
  baseDomain: string,
  allDomains: string[]
): number {
  const groups = groupDomains(allDomains)
  const group = groups.get(baseDomain)
  if (!group) return 0

  return group.filter((d) => d !== baseDomain && isPreviewDomain(d)).length
}
