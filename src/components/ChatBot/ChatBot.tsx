import { useState, useEffect, useRef, useCallback } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { X, Send, Bot, ChevronDown, AlertCircle, MessageCircle, Headphones, Paperclip, File, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendChatMessage } from '../../lib/chatService'
import type { ChatMessage } from '../../lib/chatService'
import { detectPlatform } from '../../lib/analytics'
import { useLanguage } from '../../lib/i18n/LanguageContext'

// ── Keyframes ─────────────────────────────────────────────────────
const slideUp = keyframes`from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); }`
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const pulse = keyframes`0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.5); } 50% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }`
const typing = keyframes`0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; }`
const spin = keyframes`to { transform: rotate(360deg); }`

// ── Types ─────────────────────────────────────────────────────────
type AppMode = 'ai' | 'support'
interface SupportMessage { id: string; session_id: string; role: 'user' | 'admin'; content: string; created_at: string; attachment_url?: string; attachment_type?: string }

const SUPPORT_TOKEN_KEY = 'lap_support_token'

// ── Layout ────────────────────────────────────────────────────────
const Wrap = styled.div`
  position: fixed; bottom: 28px; right: 28px; z-index: 9999;
  display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
  @media (max-width: 480px) { bottom: 16px; right: 16px; }
`
const FloatBtn = styled.button<{ $open: boolean }>`
  width: 58px; height: 58px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 26px; box-shadow: 0 8px 32px rgba(124,58,237,0.45);
  transition: transform 0.25s, box-shadow 0.25s;
  animation: ${p => p.$open ? 'none' : css`${pulse} 2.5s ease-in-out infinite`};
  &:hover { transform: scale(1.08); box-shadow: 0 12px 40px rgba(124,58,237,0.6); }
  &:active { transform: scale(0.96); }
  position: relative;
  @media (max-width: 480px) {
    display: ${p => p.$open ? 'none' : 'flex'};
  }
`
const UnreadDot = styled.div`
  position: absolute; top: 4px; right: 4px;
  width: 14px; height: 14px; border-radius: 50%;
  background: #ef4444; border: 2px solid #080814;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 900; color: #fff;
`
const Window = styled.div`
  width: 380px; height: 540px; background: rgba(8,8,20,0.97); backdrop-filter: blur(24px);
  border: 1px solid rgba(124,58,237,0.3); border-radius: 20px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  animation: ${slideUp} 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  @media (max-width: 480px) { position: fixed; inset: 0; width: 100%; height: 100%; border-radius: 0; border: none; }
`
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
  flex-shrink: 0; font-size: 20px; box-shadow: 0 4px 12px rgba(124,58,237,0.4);
`
const HeaderInfo = styled.div`flex: 1;`
const HeaderName = styled.div`font-family: 'Noto Sans Lao', sans-serif; font-size: 15px; font-weight: 700; color: #fff;`
const StatusDot = styled.div<{ $support?: boolean }>`
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: rgba(148,163,184,0.7); margin-top: 1px;
  &::before {
    content: ''; width: 7px; height: 7px; border-radius: 50%;
    background: ${p => p.$support ? '#f59e0b' : '#22c55e'};
    box-shadow: 0 0 6px ${p => p.$support ? '#f59e0b' : '#22c55e'};
    animation: ${pulse} 2s ease-in-out infinite; flex-shrink: 0;
  }
`
const HeaderActions = styled.div`display: flex; gap: 6px;`
const ActionBtn = styled.button<{ $danger?: boolean }>`
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: rgba(255,255,255,0.08); color: rgba(148,163,184,0.8);
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;
  &:hover { 
    background: ${p => p.$danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.15)'}; 
    color: ${p => p.$danger ? '#ef4444' : '#fff'}; 
  }
`

// ── Mode Tabs ────────────────────────────────────────────────────
const Tabs = styled.div`
  display: flex; border-bottom: 1px solid rgba(124,58,237,0.12); flex-shrink: 0;
`
const Tab = styled.button<{ $active: boolean }>`
  flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; cursor: pointer;
  background: ${p => p.$active ? 'rgba(124,58,237,0.15)' : 'transparent'};
  color: ${p => p.$active ? '#c4b5fd' : 'rgba(148,163,184,0.5)'};
  border-bottom: 2px solid ${p => p.$active ? '#7c3aed' : 'transparent'};
  transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 5px;
  &:hover { background: rgba(124,58,237,0.1); color: #c4b5fd; }
`

// ── Messages ─────────────────────────────────────────────────────
const Messages = styled.div`
  flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
  scroll-behavior: smooth;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 2px; }
`
const Bubble = styled.div<{ $role: 'user' | 'assistant' | 'admin' | 'error' | 'system' }>`
  padding: 10px 14px; font-size: 13.5px; line-height: 1.6;
  animation: ${fadeIn} 0.25s ease; white-space: pre-wrap; word-break: break-word;
  border-radius: ${p => p.$role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  align-self: ${p => p.$role === 'user' ? 'flex-end' : 'flex-start'};
  ${p => p.$role === 'user' && css`background: linear-gradient(135deg,#7c3aed,#9d5cf5); color:#fff; box-shadow: 0 4px 16px rgba(124,58,237,0.3);`}
  ${p => (p.$role === 'assistant' || p.$role === 'admin') && css`background: rgba(255,255,255,0.06); border: 1px solid rgba(124,58,237,0.15); color: #e2e8f0;`}
  ${p => p.$role === 'error' && css`background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; display:flex; align-items:flex-start; gap:8px;`}
  ${p => p.$role === 'system' && css`background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; font-size:12px; align-self:center; text-align:center; border-radius:8px;`}
`
const BubbleWrap = styled.div<{ $isUser: boolean }>`
  display: flex; align-items: center; gap: 6px; max-width: 88%;
  align-self: ${p => p.$isUser ? 'flex-end' : 'flex-start'};
  flex-direction: ${p => p.$isUser ? 'row-reverse' : 'row'};
  
  &:hover .msg-delete { opacity: 1; pointer-events: auto; }
`
const MsgDeleteBtn = styled.button`
  opacity: 0; pointer-events: none; flex-shrink: 0;
  width: 26px; height: 26px; border-radius: 6px; border: none;
  background: rgba(255,255,255,0.05); color: rgba(148,163,184,0.6);
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;
  &:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
`
const RoleLabel = styled.div<{ $admin?: boolean }>`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: ${p => p.$admin ? '#f59e0b' : 'rgba(148,163,184,0.4)'};
  margin-bottom: 4px;
`
const TypingBubble = styled(Bubble)` display: flex; align-items: center; gap: 5px; padding: 12px 16px; `
const Dot = styled.span<{ $delay: number }>`
  width: 7px; height: 7px; border-radius: 50%; background: rgba(148,163,184,0.6);
  animation: ${typing} 1.2s ease-in-out infinite; animation-delay: ${p => p.$delay}ms;
`

// ── Welcome / Support Start ───────────────────────────────────────
const WelcomeCard = styled.div`
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 14px; padding: 16px; text-align: center; animation: ${fadeIn} 0.4s ease;
`
const WelcomeEmoji = styled.div`font-size: 36px; margin-bottom: 8px;`
const WelcomeTitle = styled.div`font-family: 'Noto Sans Lao', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px;`
const WelcomeText = styled.div`font-size: 12px; color: rgba(148,163,184,0.7); line-height: 1.5;`
const QuickBtns = styled.div`display: flex; flex-direction: column; gap: 6px; margin-top: 10px;`
const QuickBtn = styled.button`
  padding: 8px 12px; border-radius: 8px;
  background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2);
  color: rgba(148,163,184,0.9); font-size: 12px; cursor: pointer; text-align: left; transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.2); color: #fff; border-color: rgba(124,58,237,0.4); }
`
const NameForm = styled.div`
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 14px; padding: 20px; animation: ${fadeIn} 0.3s ease;
`
const NameInput = styled.input`
  width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 10px; color: #e2e8f0; font-size: 14px; padding: 10px 13px;
  font-family: 'Noto Sans Lao', sans-serif; outline: none; box-sizing: border-box;
  &::placeholder { color: rgba(148,163,184,0.4); }
  &:focus { border-color: rgba(124,58,237,0.5); }
`

// ── Input Area ────────────────────────────────────────────────────
const InputArea = styled.div`padding: 12px 14px; border-top: 1px solid rgba(124,58,237,0.12); display: flex; gap: 8px; align-items: flex-end;`
const TextArea = styled.textarea`
  flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px;
  color: #e2e8f0; font-size: 13.5px; padding: 10px 13px; font-family: 'Noto Sans Lao', sans-serif;
  resize: none; outline: none; max-height: 100px; min-height: 40px; transition: border-color 0.2s; line-height: 1.5;
  &::placeholder { color: rgba(148,163,184,0.4); }
  &:focus { border-color: rgba(124,58,237,0.5); box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
`
const SendBtn = styled.button<{ $loading?: boolean }>`
  width: 40px; height: 40px; border-radius: 10px; border: none;
  background: ${p => p.$loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)'};
  color: #fff; cursor: ${p => p.$loading ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
  &:hover:not(:disabled) { transform: scale(1.05); }
`
const AttachBtn = styled.button`
  width: 40px; height: 40px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.05); color: rgba(148,163,184,0.7);
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  border: 1px solid rgba(124,58,237,0.2);
  &:hover { background: rgba(124,58,237,0.1); color: #c4b5fd; border-color: rgba(124,58,237,0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`
const AttachmentImage = styled.img`max-width: 100%; border-radius: 8px; margin-top: 6px; cursor: pointer;`
const AttachmentFile = styled.a`
  display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-top: 6px;
  background: rgba(0,0,0,0.2); border-radius: 8px; color: #e2e8f0; text-decoration: none; font-size: 12px;
  border: 1px solid rgba(255,255,255,0.1); transition: all 0.15s;
  &:hover { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.2); }
`
const Spinner = styled.div`
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: ${spin} 0.7s linear infinite;
`

// QUICK_QUESTIONS now generated per-locale inside component using t()

// ══════════════════════════════════════════════════════════════════
export default function ChatBot() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AppMode>('ai')
  const [hasUnread, setHasUnread] = useState(false)

  // ── AI Chat state ───
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [gameCount, setGameCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)

  // ── Support Chat state ───
  const [supportPhase, setSupportPhase] = useState<'init' | 'naming' | 'chatting'>('init')
  const [supportSessionId, setSupportSessionId] = useState<string | null>(null)
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([])
  const [supportInput, setSupportInput] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiTextRef = useRef<HTMLTextAreaElement>(null)
  const supportTextRef = useRef<HTMLTextAreaElement>(null)
  const realtimeRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Localized quick questions
  const QUICK_QUESTIONS = [t('chat.quick_q1'), t('chat.quick_q2'), t('chat.quick_q3')]

  // ── Fetch site stats ─────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: gc }, { data: gd }] = await Promise.all([
        supabase.from('games').select('id', { count: 'exact', head: true }),
        supabase.from('games').select('view_count'),
      ])
      setGameCount(gc || 0)
      setTotalViews((gd || []).reduce((s: number, g: any) => s + (g.view_count || 0), 0))
    }
    fetchStats()
  }, [])

  // ── Init support session from localStorage ───────────────────────
  useEffect(() => {
    const initSupport = async () => {
      const token = localStorage.getItem(SUPPORT_TOKEN_KEY)
      if (!token) { setSupportPhase('naming'); return }

      // Fetch existing session
      const { data: session } = await (supabase as any)
        .from('support_sessions').select('id').eq('session_token', token).single()
      if (!session) { localStorage.removeItem(SUPPORT_TOKEN_KEY); setSupportPhase('naming'); return }

      setSupportSessionId(session.id)
      // Load messages
      const { data: msgs } = await (supabase as any)
        .from('support_messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true })
      setSupportMessages(msgs || [])
      setSupportPhase('chatting')
      subscribeSupport(session.id)
    }
    initSupport()
  }, [])

  // ── Realtime subscription for support ────────────────────────────
  const subscribeSupport = (sessionId: string) => {
    try {
      // cleanup previous channel properly
      if (realtimeRef.current) {
        try {
          // supabase library may expose removeChannel
          if ((supabase as any).removeChannel) (supabase as any).removeChannel(realtimeRef.current)
          else if (realtimeRef.current.unsubscribe) realtimeRef.current.unsubscribe()
        } catch (e) { }
        realtimeRef.current = null
      }

      const ch = (supabase as any)
        .channel(`support_${sessionId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'support_messages',
          filter: `session_id=eq.${sessionId}`
        }, (payload: any) => {
          setSupportMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            if (payload.new.role === 'admin' && !open) setHasUnread(true)
            return [...prev, payload.new]
          })
        })

      // subscribe and keep ref
      ch.subscribe()
      realtimeRef.current = ch
    } catch (e) {
      // swallow errors to avoid crashing UI
      console.warn('subscribeSupport failed', e)
    }
  }

  useEffect(() => { if (open && mode === 'support') setHasUnread(false) }, [open, mode])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages, supportMessages, aiLoading, supportPhase])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [])

  // ── Start support session ────────────────────────────────────────
  const startSupportSession = async (firstMessage: string) => {
    const platform = detectPlatform()
    const token = crypto.randomUUID()
    const label = nameInput.trim() || 'ผู้ใช้ไม่ระบุตัวตน'

    // Create session
    const { data: session } = await (supabase as any)
      .from('support_sessions')
      .insert({ session_token: token, user_label: label, platform })
      .select('id').single()
    if (!session) return

    localStorage.setItem(SUPPORT_TOKEN_KEY, token)
    setSupportSessionId(session.id)

    // Save first message
    const { data: msg } = await (supabase as any)
      .from('support_messages').insert({ session_id: session.id, role: 'user', content: firstMessage }).select('*').single()
    if (msg) setSupportMessages([msg])

    // Update message_count
    await (supabase as any).from('support_sessions').update({ message_count: 1, last_seen: new Date().toISOString() }).eq('id', session.id)

    // Notify admin via email (background, silent)
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userLabel: label, firstMessage, platform, sessionId: session.id })
    }).catch(() => { })

    setSupportPhase('chatting')
    subscribeSupport(session.id)
  }

  // ── Send support message ─────────────────────────────────────────
  const sendSupportMessage = async () => {
    const content = supportInput.trim()
    if (!content || supportSending) return
    setSupportInput('')
    if (supportTextRef.current) supportTextRef.current.style.height = 'auto'

    if (supportPhase === 'naming' || !supportSessionId) {
      setSupportSending(true)
      await startSupportSession(content)
      setSupportSending(false)
      return
    }

    setSupportSending(true)
    const { data: msg } = await (supabase as any)
      .from('support_messages').insert({ session_id: supportSessionId, role: 'user', content }).select('*').single()
    if (msg) setSupportMessages(prev => [...prev, msg])

    await updateSupportLastSeen(supportSessionId)
    setSupportSending(false)
  }

  const updateSupportLastSeen = async (id: string) => {
    await (supabase as any).from('support_sessions').update({ 
      last_seen: new Date().toISOString(),
      is_read_by_admin: false 
    }).eq('id', id)
  }

  // ── Upload file ──────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Check size 2MB
    if (file.size > 2 * 1024 * 1024) { alert(t('chat.file_too_large')); return }

    if (supportPhase === 'naming' || !supportSessionId) {
      alert(t('chat.send_first_before_attach')); return
    }

    setSupportSending(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${supportSessionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error } = await supabase.storage.from('chat_attachments').upload(fileName, file)
    if (error) { alert(t('chat.upload_failed')); setSupportSending(false); return }

    const { data: urlData } = supabase.storage.from('chat_attachments').getPublicUrl(fileName)
    const type = file.type.startsWith('image/') ? 'image' : 'file'

    const { data: msg } = await (supabase as any)
      .from('support_messages').insert({
        session_id: supportSessionId,
        role: 'user',
        content: `แนบไฟล์: ${file.name}`,
        attachment_url: urlData.publicUrl,
        attachment_type: type
      }).select('*').single()

    if (msg) setSupportMessages(prev => [...prev, msg])
    await updateSupportLastSeen(supportSessionId)
    setSupportSending(false)
  }

  // ── Send AI message ──────────────────────────────────────────────
  const sendAiMessage = useCallback(async (text?: string) => {
    const content = (text ?? aiInput).trim()
    if (!content || aiLoading) return
    const userMsg: ChatMessage = { role: 'user', content }
    const newMessages = [...aiMessages, userMsg]
    setAiMessages(newMessages); setAiInput(''); setAiLoading(true)
    if (aiTextRef.current) aiTextRef.current.style.height = 'auto'
    try {
      const reply = await sendChatMessage(newMessages, { gameCount, totalViews })
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e: any) {
      const isQuota = e.message?.includes('QUOTA_EXCEEDED')
      setAiMessages(prev => [...prev, { role: 'assistant' as any, content: isQuota ? t('chat.ai_quota') : t('chat.ai_error'), _isError: true } as any])
    }
    setAiLoading(false)
  }, [aiInput, aiMessages, aiLoading, gameCount, totalViews])

  const autoResize = (el: HTMLTextAreaElement) => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px' }

  const deleteAiMessage = (index: number) => {
    if (!confirm(t('chat.delete_confirm'))) return
    setAiMessages(prev => prev.filter((_, i) => i !== index))
  }

  const deleteSupportMessage = async (id: string) => {
    if (!confirm(t('chat.delete_confirm'))) return
    setSupportMessages(prev => prev.filter(m => m.id !== id))
    await supabase.from('support_messages').delete().eq('id', id)
  }

  const resetSupport = () => {
    if (!confirm(t('chat.reset_confirm'))) return
    localStorage.removeItem(SUPPORT_TOKEN_KEY)
    if (realtimeRef.current) realtimeRef.current.unsubscribe()
    setSupportSessionId(null); setSupportMessages([]); setNameInput(''); setSupportPhase('naming')
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Wrap>
      {open && (
        <Window>
          {/* Header */}
          <Header>
            <AvatarWrap>{mode === 'support' ? '🎧' : '🤖'}</AvatarWrap>
              <HeaderInfo>
                <HeaderName>{mode === 'support' ? t('chat.support_title') : t('chat.ai_title')}</HeaderName>
                <StatusDot $support={mode === 'support'}>
                  {mode === 'support' ? t('chat.status_support') : t('chat.status_online')}
                </StatusDot>
              </HeaderInfo>
            <HeaderActions>
              <ActionBtn onClick={() => setOpen(false)} title={t('chat.close_window')} $danger>
                <X size={15} />
              </ActionBtn>
            </HeaderActions>
          </Header>

          {/* Mode Tabs */}
          <Tabs>
            <Tab $active={mode === 'ai'} onClick={() => setMode('ai')}>
              <Bot size={13} /> {t('chat.tab_ai')}
            </Tab>
            <Tab $active={mode === 'support'} onClick={() => { setMode('support'); setHasUnread(false) }}>
              <Headphones size={13} /> {t('chat.tab_support')}
              {hasUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
            </Tab>
          </Tabs>

          {/* ── AI Chat Mode ── */}
          {mode === 'ai' && (
            <>
              <Messages>
                {aiMessages.length === 0 && (
                  <WelcomeCard>
                    <WelcomeEmoji>🎮</WelcomeEmoji>
                    <WelcomeTitle>{t('chat.welcome_title')}</WelcomeTitle>
                    <WelcomeText dangerouslySetInnerHTML={{ __html: t('chat.welcome_text').replace(/\n/g, '<br/>') }} />
                    <QuickBtns>
                      {QUICK_QUESTIONS.map(q => <QuickBtn key={q} onClick={() => sendAiMessage(q)}>{q}</QuickBtn>)}
                    </QuickBtns>
                  </WelcomeCard>
                )}
                {aiMessages.map((msg, i) => (
                  <BubbleWrap key={i} $isUser={msg.role === 'user'}>
                    <Bubble $role={(msg as any)._isError ? 'error' : msg.role}>
                      {(msg as any)._isError && <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />}
                      {msg.content}
                    </Bubble>
                      {msg.role === 'user' && (
                        <MsgDeleteBtn className="msg-delete" onClick={() => deleteAiMessage(i)} title={t('chat.delete_confirm')}>
                          <Trash2 size={13} />
                        </MsgDeleteBtn>
                      )}
                  </BubbleWrap>
                ))}
                {aiLoading && <TypingBubble $role="assistant"><Dot $delay={0} /><Dot $delay={200} /><Dot $delay={400} /></TypingBubble>}
                <div ref={messagesEndRef} />
              </Messages>
              <InputArea>
                <TextArea ref={aiTextRef} placeholder="พิมพ์ข้อความ... (Enter ส่ง)" value={aiInput}
                  onChange={e => { setAiInput(e.target.value); autoResize(e.target) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() } }}
                  rows={1} disabled={aiLoading} />
                <SendBtn onClick={() => sendAiMessage()} $loading={aiLoading} disabled={aiLoading || !aiInput.trim()}>
                  {aiLoading ? <Spinner /> : <Send size={16} />}
                </SendBtn>
              </InputArea>
            </>
          )}

          {/* ── Support Chat Mode ── */}
          {mode === 'support' && (
            <>
              <Messages>
                {/* Naming Phase */}
                {supportPhase === 'naming' && (
                  <NameForm>
                    <WelcomeEmoji>🎧</WelcomeEmoji>
                    <WelcomeTitle>{t('chat.support_title')}</WelcomeTitle>
                    <WelcomeText style={{ marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: t('chat.welcome_text').replace(/\n/g, '<br/>') }} />
                    <NameInput
                      placeholder={t('chat.name_placeholder')}
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') supportTextRef.current?.focus() }}
                    />
                  </NameForm>
                )}

                {/* Chat messages */}
                {supportPhase === 'chatting' && supportMessages.length === 0 && (
                  <Bubble $role="system">{t('chat.system_waiting')}</Bubble>
                )}
                {supportMessages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role === 'admin' && <RoleLabel $admin>Admin</RoleLabel>}
                    <BubbleWrap $isUser={msg.role === 'user'}>
                      <Bubble $role={msg.role}>
                        {msg.content}
                        {msg.attachment_url && msg.attachment_type === 'image' && (
                          <AttachmentImage src={msg.attachment_url} onClick={() => window.open(msg.attachment_url, '_blank')} />
                        )}
                        {msg.attachment_url && msg.attachment_type === 'file' && (
                          <AttachmentFile href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                            <File size={14} /> {t('chat.download_file')}
                          </AttachmentFile>
                        )}
                      </Bubble>
                      {msg.role === 'user' && (
                        <MsgDeleteBtn className="msg-delete" onClick={() => deleteSupportMessage(msg.id)} title={t('chat.delete_confirm')}>
                          <Trash2 size={13} />
                        </MsgDeleteBtn>
                      )}
                    </BubbleWrap>
                  </div>
                ))}
                {supportPhase === 'chatting' && <div ref={messagesEndRef} />}
                {supportPhase === 'naming' && <div ref={messagesEndRef} />}

                {/* Reset button */}
                {supportPhase === 'chatting' && (
                  <button onClick={resetSupport} style={{ alignSelf: 'center', marginTop: 4, padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(148,163,184,0.4)', fontSize: 11, cursor: 'pointer' }}>
                    {t('chat.reset_button')}
                  </button>
                )}
              </Messages>

              <InputArea>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                <AttachBtn onClick={() => fileInputRef.current?.click()} disabled={supportSending} title={t('chat.send_first_before_attach')}>
                  <Paperclip size={18} />
                </AttachBtn>
                <TextArea ref={supportTextRef}
                  placeholder={supportPhase === 'naming' ? t('chat.input_placeholder_support_naming') : t('chat.input_placeholder_support')}
                  value={supportInput}
                  onChange={e => { setSupportInput(e.target.value); autoResize(e.target) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportMessage() } }}
                  rows={1} disabled={supportSending} />
                <SendBtn onClick={sendSupportMessage} $loading={supportSending} disabled={supportSending || !supportInput.trim()}>
                  {supportSending ? <Spinner /> : <Send size={16} />}
                </SendBtn>
              </InputArea>
            </>
          )}
        </Window>
      )}

      {/* Floating Button */}
      <FloatBtn $open={open} onClick={() => setOpen(v => !v)} title={open ? t('chat.chat_button_close') : t('chat.chat_button_open')}>
        {open ? <ChevronDown size={24} /> : <MessageCircle size={24} />}
        {!open && hasUnread && <UnreadDot>!</UnreadDot>}
      </FloatBtn>
    </Wrap>
  )
}
