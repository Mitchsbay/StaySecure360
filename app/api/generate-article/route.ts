// ============================================================
// /api/generate-article — Server-side OpenAI article generation
// ============================================================

export const dynamic = 'force-dynamic'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { validateArticle, generateValidationReport } from '@/lib/article-validation'
import type { GenerateArticleRequest, GeneratedArticleDraft } from '@/types'

type StructureMode = 'article_only'

const structureModes: StructureMode[] = ['article_only']

// ==================== MASTER SYSTEM PROMPT (Simplified + Robust) ====================
const buildSystemPrompt = () => `
You are an experienced security operator writing practical articles for StaySecure360.

Write in a calm, direct, field-informed voice. Sound like a seasoned professional sharing real observations from site inspections.

Rules:
- Focus on 3 to 4 specific, mechanical security weaknesses.
- Describe how they actually fail in practice with concrete details.
- Write naturally, like you're walking around a property and explaining what you see.
- Vary your sentence starters. Do not use repetitive patterns.
- Keep the tone practical and straightforward.

Banned phrases:
- "the first thing", "next", "then there's", "additionally", "furthermore", "finally"
- "red flag", "minimal effort", "dramatically improve", "clear signal", "alarmingly easy"

Start directly with a specific observation.
End on a quiet, practical note.

Return ONLY valid JSON with these keys:
{
  "title": "string",
  "article": "the full article body (950-1200 words)",
  "content": "same as article",
  "excerpt": "short summary",
  "slug": "string",
  "meta_title": "string",
  "meta_description": "string",
  "image_prompt": "string",
  "category": "string",
  "subcategory": "string",
  "topic_id": "string or null",
  "includeChecklist": false,
  "includeFAQ": false,
  "key_takeaways": [],
  "checklist_items": [],
  "faq_items": [],
  "suggested_topic": "string",
  "keyword_suggestions": [],
  "content_cluster": "string",
  "pillar_topic": "string",
  "internal_links": [],
  "ai_structure_mode": "article_only"
}
`

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '',
    })

    // Auth check
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { prompt } = await request.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log('[Generate] Starting generation for prompt:', prompt.substring(0, 80) + '...')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: `Topic: ${prompt}\nWrite the article now.` },
      ],
      temperature: 0.75,
      max_tokens: 4200,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      console.error('No response from OpenAI')
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    console.log('[Generate] Raw response length:', rawContent.length)

    let draft: any
    try {
      draft = JSON.parse(rawContent)
    } catch (e) {
      console.error('JSON parse error:', e, 'Raw:', rawContent.substring(0, 300))
      return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 })
    }

    // Safe content extraction
    const articleText = typeof draft.article === 'string' 
      ? draft.article.trim() 
      : typeof draft.content === 'string' 
        ? draft.content.trim() 
        : ''

    if (!articleText) {
      console.error('Empty article returned. Raw draft keys:', Object.keys(draft))
      return NextResponse.json({ 
        error: 'Generated article is empty',
        debug: { hasArticle: !!draft.article, hasContent: !!draft.content, keys: Object.keys(draft) }
      }, { status: 500 })
    }

    draft.article = articleText
    draft.content = articleText

    if (!draft.title) draft.title = prompt.slice(0, 80)
    if (!draft.slug) draft.slug = generateSlug(draft.title)
    if (!draft.excerpt) {
      draft.excerpt = articleText.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }

    draft.meta_title = draft.title.slice(0, 60)
    draft.meta_description = draft.excerpt

    // Basic defaults
    draft.content_cluster = 'physical-security-practice'
    draft.pillar_topic = 'Physical Security'
    draft.ai_structure_mode = 'article_only'
    draft.includeChecklist = false
    draft.includeFAQ = false

    // Validation
    const validation = validateArticle(articleText, 900)
    console.log(generateValidationReport(validation))

    console.log('[Generate] Success - Article length:', articleText.length)

    return NextResponse.json({ draft })

  } catch (err: unknown) {
    console.error('Generation error:', err)
    return NextResponse.json({ 
      error: 'Generation failed', 
      message: getErrorMessage(err) 
    }, { status: 500 })
  }
}

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message
  return String(err)
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST.' }, { status: 405 })
}