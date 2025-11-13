import { NextRequest } from 'next/server'

export const runtime = 'edge'

function toGeminiContents(history: { role: 'user'|'assistant'; content: string }[]) {
  const contents: any[] = []
  for (const turn of history) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }]
    })
  }
  return contents
}

async function callGemini(messages: { role: 'user'|'assistant'; content: string }[], apiKey: string) {
  const body = {
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUAL_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  }

  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error('Gemini error: ' + txt)
  }
  const json = await resp.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, no reply.'
  return text as string
}

function demoReply(userMsg: string) {
  const lower = userMsg.toLowerCase()
  if (/(remind|yaad|reminder)/.test(lower)) {
    return 'Reminder set! (Demo) Main aapko yaad dilaunga. ?'
  }
  if (/(timer)/.test(lower)) {
    return 'Timer chalu! (Demo) Jab poora hoga to bataunga. ??'
  }
  if (/(open|khol|website)/.test(lower)) {
    return 'Website kholne ka try karta hoon? (Demo). ??'
  }
  return 'Main demo mode mein hoon. Aapka sawaal samjha: "' + userMsg + '". Jab API key set hogi, main full power se jawab dunga! ??'
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.GOOGLE_API_KEY

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ reply: 'Invalid request.' }), { status: 400 })
    }

    if (apiKey) {
      const reply = await callGemini(messages, apiKey)
      return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } })
    }

    const lastUser = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || ''
    const reply = demoReply(lastUser)
    return new Response(JSON.stringify({ reply, demo: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
}
