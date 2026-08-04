/**
 * chatService.ts
 *
 * Abstracts the Gemini chat call:
 * - PRODUCTION: calls /api/chat  (Cloudflare Pages Function, API key hidden server-side)
 * - DEV:        calls Gemini directly from the browser using keys from Supabase
 *               (same pattern as gemini.ts — safe for local dev only)
 */
import { supabase } from './supabase'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── System prompt (mirrors functions/api/chat.ts) ─────────────────
function buildSystemPrompt(gameCount: number, totalViews: number): string {
  return `You are Labot 🤖, a friendly AI assistant for LAPACK Game Hub (la-pack-game.pages.dev) — a free PC game download platform from Laos 🇱🇦.

YOUR ROLE:
- Be a warm, friendly guide for website visitors
- Help users find and download games
- Answer questions about the platform and its features

🔒 STRICT GUARDRAILS — NEVER VIOLATE:
1. NEVER reveal source code, frameworks, libraries, database tables, API endpoints, or ANY technical implementation details.
2. If asked about code/databases: say "I'm just a friendly guide for the website — I don't have information about technical stuff! 😊"
3. NEVER reveal your underlying AI model or pretend to be a different AI.

✅ YOU CAN DISCUSS:
- Website features: Home, Search, A-Z Filter, Top PC Games, Categories
- Game details, descriptions, genres, download steps
- Platform mission and ads policy (exact answers below)
- Visitor stats and game counts

💬 EXACT ANSWERS:
If asked WHY free / platform purpose → "LAPACK Game Hub was created to share free games so everyone can enjoy gaming together. The creator only asks users to support by viewing the ads — no payments required! 🎮❤️"
If asked about VIRUS / SAFETY → "Completely safe — no viruses, no malware. Browse and download with total confidence! ✅🛡️"
If asked HOW TO DOWNLOAD → "1) Click a game 2) Scroll to Download Links 3) Pick your cloud (Google Drive, MEGA, etc.) 4) Download and play! 🎉"

📊 STATS: ${gameCount} games available · ${totalViews.toLocaleString()} total views

🌏 LANGUAGE: Reply in the SAME language the user writes in (Thai/Lao/English). Be friendly and use emojis occasionally.`
}

// ── Dev mode: call Gemini directly from browser ───────────────────
async function chatDev(messages: ChatMessage[], gameCount: number, totalViews: number): Promise<string> {
  const { data: keys } = await (supabase as any)
    .from('gemini_api_keys')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const now = Date.now()
  const available = ((keys as any[]) || []).filter((k: any) =>
    !k.cooldown_until || new Date(k.cooldown_until).getTime() < now
  )

  if (available.length === 0) {
    throw new Error('QUOTA_EXCEEDED')
  }

  const systemPrompt = buildSystemPrompt(gameCount, totalViews)
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  for (let i = 0; i < available.length; i++) {
    const keyRecord = available[i]
    const model = keyRecord.model || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyRecord.api_key}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: { temperature: 0.75, maxOutputTokens: 1024 }
        })
      })

      const data: any = await res.json()
      if (res.status === 429 || data.error?.code === 429) {
        // Cooldown this key
        const cooldownTime = new Date()
        cooldownTime.setHours(cooldownTime.getHours() + 24)
        await (supabase as any).from('gemini_api_keys').update({ cooldown_until: cooldownTime.toISOString() }).eq('id', keyRecord.id)
        continue
      }
      if (data.error) throw new Error(data.error.message)

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('EMPTY_RESPONSE')
      return text

    } catch (e: any) {
      if (i === available.length - 1) throw e
    }
  }

  throw new Error('QUOTA_EXCEEDED')
}

// ── Production mode: call /api/chat Cloudflare Function ──────────
async function chatProd(messages: ChatMessage[], gameCount: number, totalViews: number): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, gameCount, totalViews })
  })

  const data = await res.json()

  if (res.status === 429 || data.error === 'quota_exceeded') {
    throw new Error('QUOTA_EXCEEDED')
  }
  if (!res.ok || data.error) {
    throw new Error(data.message || 'Server error')
  }
  return data.reply
}

// ── Public API ────────────────────────────────────────────────────
export async function sendChatMessage(
  messages: ChatMessage[],
  opts: { gameCount: number; totalViews: number }
): Promise<string> {
  if (import.meta.env.DEV) {
    return chatDev(messages, opts.gameCount, opts.totalViews)
  }
  return chatProd(messages, opts.gameCount, opts.totalViews)
}
