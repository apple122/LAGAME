import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { MessageSquare, Trash2, Eye, EyeOff, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const Container = styled.div`max-width: 960px; color: #e2e8f0;`
const Title = styled.h1`
  font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #fff;
  display: flex; align-items: center; gap: 12px; margin: 0 0 8px 0;
`
const FilterRow = styled.div`display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;`
const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(124,58,237,0.25);
  background: ${p => p.$active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)'};
  color: ${p => p.$active ? '#c4b5fd' : 'rgba(148,163,184,0.7)'}; font-size: 13px;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(124,58,237,0.15); }
`
const CommentRow = styled.div`
  display: flex; gap: 14px; padding: 16px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; margin-bottom: 10px;
  opacity: ${(p: any) => p['data-hidden'] === 'true' ? 0.4 : 1};
`
const Avatar = styled.div`
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 15px; color: #fff;
`
const Meta = styled.div`flex: 1;`
const AuthorRow = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`
const Author = styled.span`font-weight: 600; font-size: 14px;`
const TypeBadge = styled.span<{ $type: string }>`
  font-size: 11px; padding: 2px 8px; border-radius: 20px;
  background: ${p => p.$type === 'game' ? 'rgba(124,58,237,0.2)' : 'rgba(6,182,212,0.2)'};
  color: ${p => p.$type === 'game' ? '#c4b5fd' : '#67e8f9'};
`
const GameTitle = styled.span`font-size: 12px; color: rgba(148,163,184,0.5);`
const CommentText = styled.p`font-size: 13.5px; color: rgba(203,213,225,0.8); margin: 4px 0 0 0; line-height: 1.6;`
const DateText = styled.span`font-size: 11px; color: rgba(148,163,184,0.4); margin-left: auto;`
const Actions = styled.div`display: flex; gap: 6px; align-items: flex-start;`
const ActionBtn = styled.button<{ $danger?: boolean }>`
  background: none; border: none; cursor: pointer; padding: 6px;
  color: ${p => p.$danger ? '#f87171' : 'rgba(148,163,184,0.5)'};
  border-radius: 6px; transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.06); color: ${p => p.$danger ? '#ef4444' : '#e2e8f0'}; }
`
const StatsRow = styled.div`display: flex; gap: 20px; margin-bottom: 24px;`
const Stat = styled.div`
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 14px 20px; flex: 1;
`
const StatNum = styled.div`font-size: 28px; font-weight: 800; color: #fff; font-family: 'Outfit', sans-serif;`
const StatLabel = styled.div`font-size: 12px; color: rgba(148,163,184,0.5); margin-top: 2px;`

interface Comment {
  id: string
  type: string
  game_id: string | null
  author_name: string
  content: string
  rating: number | null
  is_approved: boolean
  created_at: string
  game?: { title: string }
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'game' | 'website'>('all')

  const loadComments = async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('comments')
      .select('*, game:games(title)')
      .order('created_at', { ascending: false })
    setComments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadComments() }, [])

  const toggleApprove = async (c: Comment) => {
    await (supabase as any).from('comments').update({ is_approved: !c.is_approved }).eq('id', c.id)
    setComments(prev => prev.map(x => x.id === c.id ? { ...x, is_approved: !c.is_approved } : x))
  }

  const deleteComment = async (id: string) => {
    if (!confirm('ลบ Comment นี้?')) return
    await (supabase as any).from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const filtered = filter === 'all' ? comments : comments.filter(c => c.type === filter)
  const gameCount = comments.filter(c => c.type === 'game').length
  const siteCount = comments.filter(c => c.type === 'website').length

  return (
    <Container>
      <Title><MessageSquare size={26} color="#7c3aed" /> Comments Manager</Title>
      <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: 14, margin: '0 0 24px 0' }}>
        จัดการ Comment เกมและ Comment เว็บไซต์ทั้งหมด
      </p>

      <StatsRow>
        <Stat>
          <StatNum>{comments.length}</StatNum>
          <StatLabel>ทั้งหมด</StatLabel>
        </Stat>
        <Stat>
          <StatNum>{gameCount}</StatNum>
          <StatLabel>รีวิวเกม</StatLabel>
        </Stat>
        <Stat>
          <StatNum>{siteCount}</StatNum>
          <StatLabel>Guestbook</StatLabel>
        </Stat>
        <Stat>
          <StatNum>{comments.filter(c => !c.is_approved).length}</StatNum>
          <StatLabel>ซ่อนอยู่</StatLabel>
        </Stat>
      </StatsRow>

      <FilterRow>
        <Filter size={16} style={{ color: 'rgba(148,163,184,0.5)', alignSelf: 'center' }} />
        {(['all', 'game', 'website'] as const).map(f => (
          <FilterBtn key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'ทั้งหมด' : f === 'game' ? '🎮 รีวิวเกม' : '💬 Guestbook'}
            <span style={{ marginLeft: 6, opacity: 0.6 }}>
              ({f === 'all' ? comments.length : f === 'game' ? gameCount : siteCount})
            </span>
          </FilterBtn>
        ))}
      </FilterRow>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,0.4)' }}>กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
          ยังไม่มี Comment
        </div>
      ) : (
        filtered.map(c => (
          <CommentRow key={c.id} data-hidden={String(!c.is_approved)}>
            <Avatar>{c.author_name.charAt(0).toUpperCase()}</Avatar>
            <Meta>
              <AuthorRow>
                <Author>{c.author_name}</Author>
                <TypeBadge $type={c.type}>{c.type === 'game' ? '🎮 เกม' : '💬 เว็บ'}</TypeBadge>
                {c.game && <GameTitle>→ {(c.game as any).title}</GameTitle>}
                {c.rating && <span style={{ fontSize: 13 }}>{'⭐'.repeat(c.rating)}</span>}
                <DateText>{new Date(c.created_at).toLocaleString('th-TH')}</DateText>
              </AuthorRow>
              <CommentText>{c.content}</CommentText>
            </Meta>
            <Actions>
              <ActionBtn onClick={() => toggleApprove(c)} title={c.is_approved ? 'ซ่อน' : 'แสดง'}>
                {c.is_approved ? <Eye size={16} /> : <EyeOff size={16} />}
              </ActionBtn>
              <ActionBtn $danger onClick={() => deleteComment(c.id)} title="ลบ">
                <Trash2 size={16} />
              </ActionBtn>
            </Actions>
          </CommentRow>
        ))
      )}
    </Container>
  )
}
