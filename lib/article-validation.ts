/**
 * Article Validation and Quality Checking Utilities
 * Validates generated articles against quality criteria to ensure they meet standards
 * for humanness, depth, and AI-detection resistance.
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
 * List of commonly flagged AI-generated phrases that reduce humanness score
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
  'robust security posture',
  'peace of mind',
  'the key takeaway',
  'when it comes to',
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
]

/**
 * Count words in text, excluding markdown syntax
 */
export function countWords(text: string): number {
  if (!text) return 0
  // Remove markdown syntax
  const cleaned = text
    .replace(/[#*_`>\[\]()]/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
  
  // Split on whitespace and filter empty strings
  const words = cleaned.split(/\s+/).filter(word => word.length > 0)
  return words.length
}

/**
 * Find banned phrases in article content
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
  
  return [...new Set(found)] // Remove duplicates
}

/**
 * Check for polished conclusion patterns that make articles sound AI-generated
 */
export function detectPolishedConclusion(content: string): boolean {
  if (!content) return false
  
  const lowerContent = content.toLowerCase()
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
  ]
  
  return polishedPatterns.some(pattern => pattern.test(lowerContent))
}

/**
 * Check for excessive section headings (sign of template-like structure)
 */
export function countSectionHeadings(content: string): number {
  if (!content) return 0
  const headings = (content.match(/^#+\s/gm) || []).length
  return headings
}

/**
 * Validate article against quality criteria
 */
export function validateArticle(content: string, minWords: number = 1200): ValidationResult {
  const issues: string[] = []
  const warnings: string[] = []
  
  const wordCount = countWords(content)
  const bannedPhrases = findBannedPhrases(content)
  const hasPolishedConclusion = detectPolishedConclusion(content)
  const headingCount = countSectionHeadings(content)
  
  // Word count check
  if (wordCount < minWords) {
    issues.push(`Article is ${wordCount} words (minimum: ${minWords})`)
  }
  
  // Banned phrases check
  if (bannedPhrases.length > 0) {
    issues.push(`Found ${bannedPhrases.length} banned AI-detection phrases`)
  }
  
  // Polished conclusion check
  if (hasPolishedConclusion) {
    issues.push('Article ends with polished conclusion pattern (sounds AI-generated)')
  }
  
  // Section heading check
  if (headingCount > 2) {
    warnings.push(`Article has ${headingCount} section headings (prefer narrative flow)`)
  }
  
  // Calculate quality score
  let score = 100
  score -= Math.max(0, (minWords - wordCount) / minWords) * 20 // Word count penalty
  score -= bannedPhrases.length * 2 // Banned phrases penalty
  score -= hasPolishedConclusion ? 10 : 0 // Polished conclusion penalty
  score -= Math.max(0, (headingCount - 2) * 3) // Excessive headings penalty
  
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
 * Generate validation report for logging
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
