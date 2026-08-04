import { useState, useEffect, useRef, useCallback } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { X, Send, Bot, ChevronDown, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendChatMessage } from '../../lib/chatService'
import type { ChatMessage } from '../../lib/chatService'

// ── Keyframes ─────────────────────────────────────────────────────
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.5); }
  50%       { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
`
const typing = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-5px); opacity: 1; }
`
const spin = keyframes`to { transform: rotate(360deg); }`

// ── Layout ────────────────────────────────────────────────────────
const Wrap = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  @media (max-width: 480px) { bottom: 16px; right: 16px; }
`

// ── Floating Button ───────────────────────────────────────────────
const FloatBtn = styled.button<{ $open: boolean }>`
  width: 58px; height: 58px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 26px;
  box-shadow: 0 8px 32px rgba(124,58,237,0.45);
  transition: transform 0.25s, box-shadow 0.25s;
  animation: ${p => p.$open ? 'none' : css`${pulse} 2.5s ease-in-out infinite`};
  &:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(124,58,237,0.6); }
  &:active { transform: scale(0.96); }
`

// ── Chat Window ───────────────────────────────────────────────────
const Window = styled.div`
  width: 380px;
  height: 520px;
  background: rgba(8, 8, 20, 0.97);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(124,58,237,0.3);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1) inset;
  animation: ${slideUp} 0.3s cubic-bezier(0.34,1.56,0.64,1) both;

  @media (max-width: 480px) {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
  }
`

// ── Header ────────────────────────────────────────────────────────
const Header = styled.div`
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%);
  border-bottom: 1px solid rgba(124,58,237,0.2);
  display: flex; align-items: center; gap: 10px;
`
const AvatarWrap = styled.div`
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 20px;
  box-shadow: 0 4px 12px rgba(124,58,237,0.4);
`
const HeaderInfo = styled.div`flex: 1;`
const HeaderName = styled.div`
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #fff;
`
const StatusDot = styled.div`
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: rgba(148,163,184,0.7); margin-top: 1px;
  &::before {
    content: ''; width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
    animation: ${pulse} 2s ease-in-out infinite;
    flex-shrink: 0;
  }
`
const CloseBtn = styled.button`
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: rgba(255,255,255,0.08); color: rgba(148,163,184,0.8);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
  &:hover { background: rgba(239,68,68,0.2); color: #ef4444; }
`

// ── Messages Area ─────────────────────────────────────────────────
const Messages = styled.div`
  flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
  scroll-behavior: smooth;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 2px; }
`

// ── Message Bubble ────────────────────────────────────────────────
const Bubble = styled.div<{ $role: 'user' | 'assistant' | 'error' }>`
  max-width: 88%;
  padding: 10px 14px;
  border-radius: ${p => p.$role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  font-size: 13.5px;
  line-height: 1.6;
  animation: ${fadeIn} 0.25s ease;
  white-space: pre-wrap;
  word-break: break-word;

  ${p => p.$role === 'user' && css`
    align-self: flex-end;
    background: linear-gradient(135deg, #7c3aed 0%, #9d5cf5 100%);
    color: #fff;
    box-shadow: 0 4px 16px rgba(124,58,237,0.3);
  `}
  ${p => p.$role === 'assistant' && css`
    align-self: flex-start;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(124,58,237,0.15);
    color: #e2e8f0;
  `}
  ${p => p.$role === 'error' && css`
    align-self: flex-start;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    color: #fca5a5;
    display: flex; align-items: flex-start; gap: 8px;
  `}
`

// ── Typing Indicator ──────────────────────────────────────────────
const TypingBubble = styled(Bubble)`
  display: flex; align-items: center; gap: 5px; padding: 12px 16px;
`
const Dot = styled.span<{ $delay: number }>`
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(148,163,184,0.6);
  animation: ${typing} 1.2s ease-in-out infinite;
  animation-delay: ${p => p.$delay}ms;
`

// ── Welcome Card ──────────────────────────────────────────────────
const WelcomeCard = styled.div`
  background: rgba(124,58,237,0.08);
  border: 1px solid rgba(124,58,237,0.2);
  border-radius: 14px; padding: 16px;
  text-align: center;
  animation: ${fadeIn} 0.4s ease;
`
const WelcomeEmoji = styled.div`font-size: 36px; margin-bottom: 8px;`
const WelcomeTitle = styled.div`
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;
`
const WelcomeText = styled.div`font-size: 12px; color: rgba(148,163,184,0.7); line-height: 1.5;`

const QuickBtns = styled.div`display: flex; flex-direction: column; gap: 6px; margin-top: 10px;`
const QuickBtn = styled.button`
  padding: 8px 12px; border-radius: 8px;
  background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2);
  color: rgba(148,163,184,0.9); font-size: 12px; cursor: pointer;
  text-align: left; transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.2); color: #fff; border-color: rgba(124,58,237,0.4); }
`

// ── Input Area ────────────────────────────────────────────────────
const InputArea = styled.div`
  padding: 12px 14px;
  border-top: 1px solid rgba(124,58,237,0.12);
  display: flex; gap: 8px; align-items: flex-end;
`
const TextArea = styled.textarea`
  flex: 1; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(124,58,237,0.2); border-radius: 12px;
  color: #e2e8f0; font-size: 13.5px; padding: 10px 13px;
  font-family: 'Inter', sans-serif; resize: none; outline: none;
  max-height: 100px; min-height: 40px;
  transition: border-color 0.2s;
  &::placeholder { color: rgba(148,163,184,0.4); }
  &:focus { border-color: rgba(124,58,237,0.5); box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  line-height: 1.5;
`
const SendBtn = styled.button<{ $loading?: boolean }>`
  width: 40px; height: 40px; border-radius: 10px; border: none;
  background: ${p => p.$loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)'};
  color: #fff; cursor: ${p => p.$loading ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
  &:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 16px rgba(124,58,237,0.4); }
`
const Spinner = styled.div`
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: ${spin} 0.7s linear infinite;
`

// ── Quick suggestions ─────────────────────────────────────────────
const QUICK_QUESTIONS = [
  '🎮 มีเกมอะไรแนะนำบ้าง?',
  '📥 วิธีดาวน์โหลดเกม?',
  '💰 เว็บนี้ฟรีไหม? มีเงื่อนไขไหม?',
]

// ── Main Component ────────────────────────────────────────────────
export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [gameCount, setGameCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch stats once on mount
  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: gc }, { data: gamesData }] = await Promise.all([
        supabase.from('games').select('id', { count: 'exact', head: true }),
        supabase.from('games').select('view_count'),
      ])
      setGameCount(gc || 0)
      const views = (gamesData || []).reduce((s: number, g: any) => s + (g.view_count || 0), 0)
      setTotalViews(views)
    }
    fetchStats()
  }, [])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: ChatMessage = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textAreaRef.current) textAreaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const reply = await sendChatMessage(newMessages, { gameCount, totalViews })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e: any) {
      const isQuota = e.message?.includes('QUOTA_EXCEEDED')
      const errMsg = isQuota
        ? '⏳ ระบบยุ่งชั่วคราว / หมด token แล้ว กรุณาลองใหม่ภายหลัง\n\nThe system is temporarily busy. Please try again later. 🙏'
        : '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง\n\nSomething went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant' as any, content: errMsg, _isError: true } as any])
    }
    setLoading(false)
  }, [input, messages, loading, gameCount, totalViews])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isError = (msg: any) => msg._isError === true

  return (
    <Wrap>
      {open && (
        <Window>
          {/* Header */}
          <Header>
            <AvatarWrap>🤖</AvatarWrap>
            <HeaderInfo>
              <HeaderName>Labot — AI Assistant</HeaderName>
              <StatusDot>Online · LAPACK Game Hub</StatusDot>
            </HeaderInfo>
            <CloseBtn onClick={() => setOpen(false)} title="Close">
              <X size={15} />
            </CloseBtn>
          </Header>

          {/* Messages */}
          <Messages>
            {messages.length === 0 && (
              <WelcomeCard>
                <WelcomeEmoji>🎮</WelcomeEmoji>
                <WelcomeTitle>สวัสดี! ฉันชื่อ Labot</WelcomeTitle>
                <WelcomeText>
                  ผู้ช่วย AI ของ LAPACK Game Hub 🇱🇦<br />
                  ถามอะไรก็ได้เกี่ยวกับเว็บไซต์และเกมได้เลย!
                </WelcomeText>
                <QuickBtns>
                  {QUICK_QUESTIONS.map(q => (
                    <QuickBtn key={q} onClick={() => send(q)}>{q}</QuickBtn>
                  ))}
                </QuickBtns>
              </WelcomeCard>
            )}

            {messages.map((msg, i) => (
              <Bubble
                key={i}
                $role={isError(msg) ? 'error' : msg.role}
              >
                {isError(msg) && <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />}
                {msg.content}
              </Bubble>
            ))}

            {loading && (
              <TypingBubble $role="assistant">
                <Dot $delay={0} />
                <Dot $delay={200} />
                <Dot $delay={400} />
              </TypingBubble>
            )}
            <div ref={messagesEndRef} />
          </Messages>

          {/* Input */}
          <InputArea>
            <TextArea
              ref={textAreaRef}
              placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <SendBtn onClick={() => send()} $loading={loading} disabled={loading || !input.trim()}>
              {loading ? <Spinner /> : <Send size={16} />}
            </SendBtn>
          </InputArea>
        </Window>
      )}

      {/* Floating Button */}
      <FloatBtn
        $open={open}
        onClick={() => setOpen(v => !v)}
        title={open ? 'Close chat' : 'Chat with Labot AI'}
      >
        {open ? <ChevronDown size={24} /> : <Bot size={26} />}
      </FloatBtn>
    </Wrap>
  )
}
