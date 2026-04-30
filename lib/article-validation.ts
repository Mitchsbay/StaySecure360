/**
 * Article Validation and Quality Checking Utilities
 * Validates generated articles against quality criteria to ensure they meet standards
 * for humanness, operational realism, and AI-detection resistance.
 */

export interface ValidationResult {
  isValid: boolean
  wordCount: number
  issues: string[]
  warnings: string[]
  bannedPhrases: string[]
  score: number // 0-100
}

/**
 * Phrases that commonly make content sound AI-generated, over-polished,
 * theatrical, or fake-gritty rather than operationally credible.
 */
const BANNED_PHRASES = [
  'in today\'s world',
  'it is important to note',
  'in conclusion',
  'according to experts',
  'organisations must ensure',
  'now more than ever',
  'a comprehensive approach',
  'this article explores',
  'delve into',
  'robust security',
  'robust security posture',
  'peace of mind',
  'the key takeaway',
  'when it comes to',
  'crucial to consider',
  'stay vigilant',
  'culture of awareness',
  'security is everyone\'s responsibility',
  'provide a valuable insight',
  'left an indelible mark',
  'a stark reminder',
  'a nuanced understanding',
  'the complex interplay',
  'an unwavering commitment',
  'underscore the importance',
  'play a pivotal role',
  'a pivotal moment',
  'navigate the complex',
  'mark a turning point',
  'gain a deeper understanding',
  'the transformative power',
  'a multi-faceted approach',
  'highlight the potential',
  'pave the way for',
  'let\'s break this down',
  'there are several reasons',
  'another common issue',
  'a significant issue',
  'in many cases',
  'so, what can you do',
  'ultimately',
  'furthermore',
  'moreover',
  'additionally',
  'finally',
  'firstly',
  'secondly',
  'it\'s a quiet evening',
  'settle into your armchair',
  'imagine a scenario',
  'false sense of security',
  'the reality is',
  'hollywood break-ins',
  'movie villains',
  'bad guys',
  'battlefield',
  'frontier',
  'brutal truth',
  'wake-up call',
  'game changer',
  'hard truth',
  'no-nonsense',
  'not good',
  'no gadget replaces grit',
  'enough with the excuses',
  'security isn\'t sexy',
  'not sexy',
  'lazy thieves',
  'come on in',
  'fortress',
  'lasers',
  'rfid jammer',
  'hacking gadget',
]

/**
 * Count words in text, excluding markdown syntax.
 */
export function countWords(text: string): number {
  if (!text) return 0
  const cleaned = text
    .replace(/[#*_`>\[\]()]/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()

  const words = cleaned.split(/\s+/).filter((word) => word.length > 0)
  return words.length
}

/**
 * Find banned phrases in article content.
 */
export function findBannedPhrases(content: string): string[] {
  if (!content) return []

  const lowerContent = content.toLowerCase()
  const found: string[] = []

  for (const phrase of BANNED_PHRASES) {
    if (lowerContent.includes(phrase)) {
      found.push(phrase)
    }
  }

  return [...new Set(found)]
}

/**
 * Check for polished conclusion patterns that make articles sound AI-generated.
 */
export function detectPolishedConclusion(content: string): boolean {
  if (!content) return false

  const paragraphs = content.trim().split(/\n{2,}/).filter(Boolean)
  const closingText = paragraphs.slice(-2).join(' ').toLowerCase()
  const polishedPatterns = [
    /in conclusion[,.]?/,
    /to summarize[,.]?/,
    /in summary[,.]?/,
    /to wrap up[,.]?/,
    /in essence[,.]?/,
    /ultimately[,.]?/,
    /therefore[,.]?/,
    /thus[,.]?/,
    /as mentioned[,.]?/,
    /as discussed[,.]?/,
    /by implementing these strategies/,
    /can significantly reduce your risk/,
    /ensure peace of mind/,
    /requires a multi-faceted approach/,
    /remember, security is/,
    /the key takeaway/,
  ]

  return polishedPatterns.some((pattern) => pattern.test(closingText))
}

/**
 * Check for excessive section headings (sign of template-like structure).
 */
export function countSectionHeadings(content: string): number {
  if (!content) return 0
  return (content.match(/^#+\s/gm) || []).length
}

/**
 * Check for visible bullet or numbered-list structure in the article body.
 */
export function countListMarkers(content: string): number {
  if (!content) return 0
  return (content.match(/^\s*(?:[-*•]|\d+\.)\s+/gm) || []).length
}

/**
 * Detect repeated category-by-category openings, which make the article read
 * like a report rather than a practitioner narrative.
 */
export function detectReportLikeStructure(content: string): boolean {
  if (!content) return false

  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const categoryOpeners = [
    /^windows?\s+(are|is|can|also)/i,
    /^doors?\s+(are|is|can|also)/i,
    /^locks?\s+(are|is|can|also)/i,
    /^gates?\s+(are|is|can|also)/i,
    /^fences?\s+(are|is|can|also)/i,
    /^cctv\s+(cameras\s+)?(are|is|can|also|frequently)/i,
    /^cameras?\s+(are|is|can|also|frequently)/i,
    /^alarm\s+systems?\s+(are|is|can|also|themselves|suffer)/i,
    /^for\s+(rental\s+properties|businesses|homeowners|landlords)/i,
    /^practical\s+(perimeter\s+)?security\s+(means|requires|starts)/i,
    /^another\s+(common\s+)?(issue|problem|weakness)/i,
  ]

  const hits = paragraphs.filter((paragraph) =>
    categoryOpeners.some((pattern) => pattern.test(paragraph))
  ).length

  return hits >= 3
}

/**
 * Detect forced or SEO-style internal link placement.
 */
export function detectForcedInternalLinks(content: string): boolean {
  if (!content) return false

  const lowerContent = content.toLowerCase()
  const forcedLinkPhrases = [
    'it\'s worth looking at',
    'for a broader look',
    'i often reference',
    'check out',
    'the failure mode here is similar',
    'the failure mode here is remarkably similar',
    'to see how this plays out elsewhere',
  ]

  const hasForcedPhrase = forcedLinkPhrases.some((phrase) => lowerContent.includes(phrase))
  const hasArticleMarkdownLink = /\[[^\]]+\]\((?:\/articles\/|https?:\/\/[^)]*staysecure360\.com\/)/i.test(content)

  return hasForcedPhrase || hasArticleMarkdownLink
}

/**
 * Check for AI-like intro hooks.
 */
export function detectAIIntro(content: string): boolean {
  if (!content) return false
  const intro = content.split('\n\n')[0].toLowerCase()
  const aiIntroPatterns = [
    /it\'s a quiet evening/,
    /imagine a scenario/,
    /you settle into your armchair/,
    /in today\'s world/,
    /picture this:/,
    /this article explores/,
  ]
  return aiIntroPatterns.some((pattern) => pattern.test(intro))
}

/**
 * Validate article against quality criteria.
 */
export function validateArticle(content: string, minWords: number = 850): ValidationResult {
  const issues: string[] = []
  const warnings: string[] = []

  const wordCount = countWords(content)
  const bannedPhrases = findBannedPhrases(content)
  const hasPolishedConclusion = detectPolishedConclusion(content)
  const hasAIIntro = detectAIIntro(content)
  const headingCount = countSectionHeadings(content)
  const listMarkerCount = countListMarkers(content)
  const hasReportLikeStructure = detectReportLikeStructure(content)
  const hasForcedInternalLinks = detectForcedInternalLinks(content)

  if (wordCount < minWords) {
    issues.push(`Article is ${wordCount} words (minimum: ${minWords})`)
  }

  if (bannedPhrases.length > 0) {
    issues.push(`Found ${bannedPhrases.length} banned AI/fake-grit phrases`)
  }

  if (hasPolishedConclusion) {
    issues.push('Article ends with polished conclusion pattern')
  }

  if (hasAIIntro) {
    issues.push('Article starts with common AI intro hook')
  }

  if (headingCount > 0) {
    warnings.push(`Article has ${headingCount} markdown heading(s); prefer narrative flow with no headings`)
  }

  if (listMarkerCount > 0) {
    warnings.push(`Article has ${listMarkerCount} bullet/numbered list marker(s); visible article should not read like a checklist`)
  }

  if (hasReportLikeStructure) {
    warnings.push('Article has repeated category-by-category openings and may read like a report-like checklist')
  }

  if (hasForcedInternalLinks) {
    warnings.push('Article appears to contain forced internal link placement')
  }

  let score = 100
  score -= Math.max(0, (minWords - wordCount) / minWords) * 20
  score -= bannedPhrases.length * 5
  score -= hasPolishedConclusion ? 15 : 0
  score -= hasAIIntro ? 20 : 0
  score -= headingCount * 8
  score -= listMarkerCount * 4
  score -= hasReportLikeStructure ? 18 : 0
  score -= hasForcedInternalLinks ? 12 : 0

  score = Math.max(0, Math.min(100, score))

  return {
    isValid: issues.length === 0,
    wordCount,
    issues,
    warnings,
    bannedPhrases,
    score: Math.round(score),
  }
}

/**
 * Generate validation report for logging.
 */
export function generateValidationReport(validation: ValidationResult): string {
  const lines = [
    `[Quality Check] Word Count: ${validation.wordCount}`,
    `[Quality Check] Quality Score: ${validation.score}/100`,
  ]

  if (validation.bannedPhrases.length > 0) {
    lines.push(`[Quality Check] Banned Phrases: ${validation.bannedPhrases.join(', ')}`)
  }

  if (validation.issues.length > 0) {
    lines.push(`[Quality Check] Issues: ${validation.issues.join(' | ')}`)
  }

  if (validation.warnings.length > 0) {
    lines.push(`[Quality Check] Warnings: ${validation.warnings.join(' | ')}`)
  }

  return lines.join('\n')
}
