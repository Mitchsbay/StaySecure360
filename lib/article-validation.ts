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
  'plays a silent but crucial role',
  'a frequent misstep',
  'as important as locks and alarms',
  'access control point',
  'unauthorized access',
  'unauthorised access',
  'cumulative failures',
  'layered approach',
  'risk controls',
  'perimeter defenses',
  'perimeter defences',
  'deterrence value',
  'security posture',
  'formal assessment',
  'mitigation strategy',
  'nullify front-door security measures',
  'practical perimeter security means',
  'the initial unauthorized entry',
  'the initial unauthorised entry',
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
export function getReportLikeParagraphOpenings(content: string): string[] {
  if (!content) return []

  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const categoryOpeners = [
    /^windows?\b/i,
    /^doors?\b/i,
    /^door\s+locks?\b/i,
    /^locks?\b/i,
    /^deadbolts?\b/i,
    /^gates?\b/i,
    /^fences?\b/i,
    /^fences?\s+and\s+gates?\b/i,
    /^rear\s+sliding\s+doors?\b/i,
    /^sliding\s+doors?\b/i,
    /^cctv\b/i,
    /^cameras?\b/i,
    /^camera\s+coverage\b/i,
    /^alarm\s+systems?\b/i,
    /^alarms?\b/i,
    /^lighting\b/i,
    /^landscaping\b/i,
    /^lastly\b/i,
    /^for\s+(rental\s+properties|businesses|homeowners|landlords|tenants)\b/i,
    /^a\s+frequent\s+misstep\b/i,
    /^opportunistic\s+burglars\b/i,
    /^practical\s+(perimeter\s+)?security\b/i,
    /^another\s+(common\s+)?(issue|problem|weakness)\b/i,
  ]

  return paragraphs
    .filter((paragraph) => categoryOpeners.some((pattern) => pattern.test(paragraph)))
    .map((paragraph) => paragraph.split(/\s+/).slice(0, 6).join(' '))
}

/**
 * Detect repeated category-by-category openings, which make the article read
 * like a report rather than a practitioner narrative.
 */
export function detectReportLikeStructure(content: string): boolean {
  return getReportLikeParagraphOpenings(content).length >= 2
}

/**
 * Detect scope drift where the article tries to cover too many standalone
 * issue areas instead of following one inspection route or failure pattern.
 */
export function detectScopeDrift(content: string): boolean {
  return getReportLikeParagraphOpenings(content).length >= 3
}

/**
 * Detect repetitive field-observation openings that make a draft feel generated
 * even when the content itself is operationally accurate.
 */
export function getRepetitiveFieldOpenings(content: string): string[] {
  if (!content) return []

  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const repeatedOpeners = [
    /^a\s+common\s+(issue|failure|problem|weakness)\b/i,
    /^i\s+often\s+(find|see|encounter|observe|come\s+across)\b/i,
    /^i\s+regularly\s+(find|see|encounter|observe|come\s+across)\b/i,
    /^frequently\b/i,
    /^in\s+many\s+cases\b/i,
    /^in\s+some\s+cases\b/i,
    /^many\s+(homes|sites|properties|businesses)\b/i,
  ]

  return paragraphs
    .filter((paragraph) => repeatedOpeners.some((pattern) => pattern.test(paragraph)))
    .map((paragraph) => paragraph.split(/\s+/).slice(0, 7).join(' '))
}

export function detectRepetitiveFieldOpenings(content: string): boolean {
  return getRepetitiveFieldOpenings(content).length >= 3
}

/**
 * Detect formal audit/report register in public article copy. Some technical terms are
 * fine in moderation, but repeated report language makes the piece feel templated.
 */
export function getFormalAuditTerms(content: string): string[] {
  if (!content) return []

  const lowerContent = content.toLowerCase()
  const terms = [
    'access control point',
    'unauthorized access',
    'unauthorised access',
    'cumulative failures',
    'layered approach',
    'risk controls',
    'perimeter defenses',
    'perimeter defences',
    'deterrence value',
    'security posture',
    'formal assessment',
    'mitigation strategy',
    'practical perimeter security means',
  ]

  return terms.filter((term) => lowerContent.includes(term))
}

export function detectFormalAuditLanguage(content: string): boolean {
  return getFormalAuditTerms(content).length >= 1
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
  const reportLikeOpenings = getReportLikeParagraphOpenings(content)
  const repetitiveFieldOpenings = getRepetitiveFieldOpenings(content)
  const formalAuditTerms = getFormalAuditTerms(content)
  const hasReportLikeStructure = detectReportLikeStructure(content)
  const hasScopeDrift = detectScopeDrift(content)
  const hasRepetitiveFieldOpenings = detectRepetitiveFieldOpenings(content)
  const hasFormalAuditLanguage = detectFormalAuditLanguage(content)
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
    warnings.push(`Article has repeated category-by-category openings and may read like a report-like checklist: ${reportLikeOpenings.join(' | ')}`)
  }

  if (hasScopeDrift) {
    warnings.push(`Article shows scope drift / too many issue areas for one human-style article: ${reportLikeOpenings.join(' | ')}`)
  }

  if (hasRepetitiveFieldOpenings) {
    warnings.push(`Article uses repetitive field phrasing and may feel generated: ${repetitiveFieldOpenings.join(' | ')}`)
  }

  if (hasFormalAuditLanguage) {
    warnings.push(`Article uses formal audit/report language for a public article: ${formalAuditTerms.join(' | ')}`)
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
  score -= hasScopeDrift ? 18 : 0
  score -= hasRepetitiveFieldOpenings ? 12 : 0
  score -= hasFormalAuditLanguage ? 12 : 0
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
