"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ChatTurn = { role: 'user' | 'assistant'; content: string }

function useSpeech() {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (SR) {
      setSupported(true)
      const rec: SpeechRecognition = new SR()
      rec.lang = 'hi-IN'
      rec.continuous = false
      rec.interimResults = true
      recognitionRef.current = rec
    }
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setListening(true)
    recognitionRef.current.start()
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { recognition: recognitionRef.current, start, stop, listening, supported }
}

function speak(text: string, lang = 'hi-IN') {
  if (typeof window === 'undefined') return
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 1.0
  utter.pitch = 1.05
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}

function Robot({ state }: { state: 'idle' | 'listening' | 'speaking' }) {
  const className = useMemo(() => {
    if (state === 'listening') return 'robot walking'
    if (state === 'speaking') return 'robot floaty'
    return 'robot'
  }, [state])

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <g className="body">
          <rect x="26" y="28" rx="16" width="68" height="64" fill="url(#g1)"/>
          <rect x="40" y="76" rx="10" width="40" height="12" fill="#fff" opacity=".14"/>
          <circle cx="48" cy="55" r="7" fill="#0b0b12" />
          <circle cx="72" cy="55" r="7" fill="#0b0b12" />
          <circle cx="48" cy="55" r="3" fill="#22d3ee" />
          <circle cx="72" cy="55" r="3" fill="#22d3ee" />
          <rect x="54" y="16" rx="6" width="12" height="18" fill="#7c3aed" />
          <circle cx="60" cy="16" r="4" fill="#22d3ee" />
        </g>
      </svg>
      <div className="text-sm opacity-80">
        {state === 'listening' ? 'Sun raha hoon?' : state === 'speaking' ? 'Bol raha hoon?' : 'Ready!'}
      </div>
    </div>
  )
}

export default function Home() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [agentState, setAgentState] = useState<'idle'|'listening'|'speaking'>('idle')
  const { recognition, start, stop, listening, supported } = useSpeech()
  const interimRef = useRef('')

  useEffect(() => {
    if (!recognition) return
    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) {
          const text = r[0].transcript.trim()
          setChat((prev) => [...prev, { role: 'user', content: text }])
          interimRef.current = ''
        } else {
          interim += r[0].transcript
        }
      }
      interimRef.current = interim
      setInput(interim)
    }
    recognition.onstart = () => setAgentState('listening')
    recognition.onend = () => {
      setAgentState('idle')
      setInput('')
    }
  }, [recognition])

  const ask = async (message: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chat, { role: 'user', content: message }] })
      })
      const data = await res.json()
      const reply = data.reply as string
      setChat((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: reply }])
      setAgentState('speaking')
      speak(reply)
    } catch (e) {
      setChat((prev) => [...prev, { role: 'assistant', content: 'Maaf kijiye, koi dikkat aa gayi. Dobara koshish karein.' }])
    } finally {
      setLoading(false)
      setTimeout(() => setAgentState('idle'), 1200)
    }
  }

  const onSend = async () => {
    const msg = input.trim()
    if (!msg) return
    setInput('')
    await ask(msg)
  }

  return (
    <main className="min-h-screen p-4 pb-28">
      <div className="container-card p-4 mt-6">
        <div className="flex items-center justify-between">
          <Robot state={agentState} />
          <button
            className={`mic-button ${listening ? 'listening' : ''}`}
            onClick={() => (listening ? stop() : start())}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" stroke="white" strokeWidth="1.6"/>
              <path d="M5 11v1a7 7 0 0 0 14 0v-1" stroke="white" strokeWidth="1.6"/>
              <path d="M12 18v4" stroke="white" strokeWidth="1.6"/>
            </svg>
          </button>
        </div>

        <div className="mt-4 h-[52vh] overflow-y-auto space-y-3 pr-1">
          {chat.length === 0 && (
            <div className="text-sm opacity-70">
              Namaste! Bina type kiye bolo?main aapka dostana Jarvis hoon. ??
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`message ${m.role === 'user' ? 'message-user ml-auto' : 'message-bot mr-auto'}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="message message-bot mr-auto opacity-80">Soch raha hoon?</div>}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder={supported ? 'Bolkar bhi pooch sakte hain?' : 'Type karein?'}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 h-12 outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button className="btn-primary h-12" onClick={onSend} disabled={loading}>Send</button>
        </div>

        <div className="mt-3 text-[11px] opacity-60">
          Tip: Microphone ke liye Chrome/Android best hai. Gemini free key set ho to real AI chalega; warna demo mode.
        </div>
      </div>
    </main>
  )
}
