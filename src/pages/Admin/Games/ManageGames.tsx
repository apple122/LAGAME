import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Plus, Edit2, Trash2, Search, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Game } from '../../../lib/supabase'

const Header = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;`
const Title = styled.h1`font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #fff;`

const AddBtn = styled(Link)`
  display: flex; align-items: center; gap: 6px; padding: 10px 18px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4); border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #fff; transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`

const SearchBar = styled.div`position: relative; max-width: 320px; margin-bottom: 20px;`
const SearchInput = styled.input`
  width: 100%; padding: 9px 14px 9px 38px;
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; color: #e2e8f0; font-size: 13px; outline: none;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(148,163,184,0.4); }
`
const SearchIcon = styled.div`position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(148,163,184,0.4); pointer-events: none;`

const Table = styled.div`
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15); border-radius: 16px; overflow: hidden;
`

const TableHead = styled.div`
  display: grid; grid-template-columns: 52px 1fr 140px 80px 100px;
  padding: 12px 16px;
  background: rgba(124,58,237,0.08); border-bottom: 1px solid rgba(124,58,237,0.12);
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: rgba(148,163,184,0.5);
  @media (max-width: 600px) { grid-template-columns: 52px 1fr 80px; }
`

const Row = styled.div`
  display: grid; grid-template-columns: 52px 1fr 140px 80px 100px;
  padding: 12px 16px; align-items: center;
  border-bottom: 1px solid rgba(124,58,237,0.06); transition: background 0.15s;
  &:hover { background: rgba(124,58,237,0.05); }
  &:last-child { border-bottom: none; }
  @media (max-width: 600px) { grid-template-columns: 52px 1fr 80px; }
`

const Thumb = styled.img`width: 44px; height: 30px; object-fit: cover; border-radius: 5px;`
const ThumbPlaceholder = styled.div`width: 44px; height: 30px; background: rgba(124,58,237,0.1); border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 16px;`
const GameTitle = styled.span`font-size: 14px; font-weight: 500; color: #e2e8f0;`
const CatBadge = styled.span`font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(124,58,237,0.15); color: #9d5cf5; @media(max-width:600px){display:none}`
const ViewCount = styled.span`font-size: 13px; color: rgba(148,163,184,0.6); @media(max-width:600px){display:none}`
const Actions = styled.div`display: flex; gap: 6px;`
const ActionBtn = styled.button<{ $danger?: boolean }>`
  width: 30px; height: 30px; border-radius: 6px; border: 1px solid ${p => p.$danger ? 'rgba(239,68,68,0.25)' : 'rgba(124,58,237,0.2)'};
  background: transparent; color: ${p => p.$danger ? '#ef4444' : 'rgba(148,163,184,0.6)'};
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;
  &:hover { background: ${p => p.$danger ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)'}; color: ${p => p.$danger ? '#ef4444' : '#fff'}; }
`

const Empty = styled.div`text-align: center; padding: 60px; color: rgba(148,163,184,0.4);`
const Loading = styled.div`display: flex; align-items: center; justify-content: center; padding: 60px; gap: 10px; font-size: 14px; color: rgba(148,163,184,0.5);`

const ConfirmModal = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
`
const ModalCard = styled.div`
  background: rgba(18,18,31,0.97); border: 1px solid rgba(239,68,68,0.3);
  border-radius: 16px; padding: 28px; max-width: 360px; width: 90%; text-align: center;
`

export default function ManageGames() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchGames = async () => {
    setLoading(true)
    let q = supabase.from('games').select('*, category:categories(id,name)').order('created_at', { ascending: false }).limit(500)
    if (search) q = q.ilike('title', `%${search}%`)
    const { data } = await q
    setGames((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { fetchGames() }, [search])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('games').delete().eq('id', deleteId)
    setDeleteId(null); setDeleting(false)
    fetchGames()
  }

  return (
    <div>
      <Header>
        <Title>🎮 Manage Games</Title>
        <AddBtn to="/ap-admin/games/add"><Plus size={15} /> Add Game</AddBtn>
      </Header>

      <SearchBar>
        <SearchIcon><Search size={14} /></SearchIcon>
        <SearchInput placeholder="Search games..." value={search} onChange={e => setSearch(e.target.value)} />
      </SearchBar>

      <Table>
        <TableHead>
          <div></div>
          <div>Title</div>
          <div>Category</div>
          <div>Views</div>
          <div>Actions</div>
        </TableHead>
        {loading ? (
          <Loading><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading...</Loading>
        ) : games.length === 0 ? (
          <Empty><div style={{ fontSize: 40, marginBottom: 10 }}>🎮</div><p>No games found</p></Empty>
        ) : (
          games.map(g => (
            <Row key={g.id}>
              {g.cover_image ? <Thumb src={g.cover_image} alt={g.title} /> : <ThumbPlaceholder>🎮</ThumbPlaceholder>}
              <GameTitle>{g.title}</GameTitle>
              <CatBadge>{(g as any).category?.name || '—'}</CatBadge>
              <ViewCount>{g.view_count || 0}</ViewCount>
              <Actions>
                <ActionBtn onClick={() => navigate(`/ap-admin/games/edit/${g.id}`)}><Edit2 size={13} /></ActionBtn>
                <ActionBtn $danger onClick={() => setDeleteId(g.id)}><Trash2 size={13} /></ActionBtn>
              </Actions>
            </Row>
          ))
        )}
      </Table>

      {deleteId && (
        <ConfirmModal>
          <ModalCard>
            <AlertCircle size={32} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>Delete Game?</h3>
            <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.2)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </ModalCard>
        </ConfirmModal>
      )}
    </div>
  )
}
