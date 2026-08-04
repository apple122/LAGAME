import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Gamepad2, Tags, Eye, Plus, TrendingUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;
`

const StatCard = styled.div<{ $color: string }>`
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15);
  border-radius: 16px; padding: 22px 20px;
  border-top: 3px solid ${p => p.$color};
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
`

const StatNum = styled.div<{ $color: string }>`
  font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 900;
  color: ${p => p.$color}; line-height: 1;
`

const StatLabel = styled.div`font-size: 13px; color: rgba(148,163,184,0.6); margin-top: 6px; font-weight: 500;`

const Section = styled.div`
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15);
  border-radius: 16px; padding: 24px; margin-bottom: 24px;
`

const SectionHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
`

const SectionTitle = styled.h2`
  font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #fff;
  display: flex; align-items: center; gap: 8px;
`

const AddBtn = styled(Link)`
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4); border-radius: 8px;
  font-size: 13px; font-weight: 600; color: #fff; transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`

const GameRow = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid rgba(124,58,237,0.08);
  &:last-child { border-bottom: none; }
`

const GameThumb = styled.img`width: 52px; height: 36px; object-fit: cover; border-radius: 6px;`
const GameThumbPlaceholder = styled.div`width: 52px; height: 36px; background: rgba(124,58,237,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px;`

const GameTitle = styled.span`font-size: 14px; font-weight: 500; color: #e2e8f0; flex: 1;`

const ViewCount = styled.span`font-size: 12px; color: rgba(148,163,184,0.5); display: flex; align-items: center; gap: 4px;`

export default function AdminDashboard() {
  const [stats, setStats] = useState({ games: 0, categories: 0, totalViews: 0 })
  const [recentGames, setRecentGames] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [{ count: gc }, { count: cc }, { data: games }] = await Promise.all([
        supabase.from('games').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('games').select('id,title,cover_image,view_count,created_at').order('created_at', { ascending: false }).limit(8),
      ])
      const totalViews = (games || []).reduce((s: number, g: any) => s + (g.view_count || 0), 0)
      setStats({ games: gc || 0, categories: cc || 0, totalViews })
      setRecentGames(games || [])
    }
    load()
  }, [])

  return (
    <div>
      <h1 style={{ fontFamily: 'Outfit', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <TrendingUp size={24} style={{ color: '#7c3aed' }} /> Dashboard
      </h1>

      <Grid>
        <StatCard $color="#7c3aed">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Gamepad2 size={18} style={{ color: '#7c3aed' }} /></div>
          <StatNum $color="#7c3aed">{stats.games}</StatNum>
          <StatLabel>Total Games</StatLabel>
        </StatCard>
        <StatCard $color="#06b6d4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Tags size={18} style={{ color: '#06b6d4' }} /></div>
          <StatNum $color="#06b6d4">{stats.categories}</StatNum>
          <StatLabel>Categories</StatLabel>
        </StatCard>
        <StatCard $color="#22c55e">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Eye size={18} style={{ color: '#22c55e' }} /></div>
          <StatNum $color="#22c55e">{stats.totalViews.toLocaleString()}</StatNum>
          <StatLabel>Total Views</StatLabel>
        </StatCard>
      </Grid>

      <Section>
        <SectionHeader>
          <SectionTitle><Gamepad2 size={16} /> Recent Games</SectionTitle>
          <AddBtn to="/ap-admin/games/add"><Plus size={14} /> Add Game</AddBtn>
        </SectionHeader>
        {recentGames.map(g => (
          <GameRow key={g.id}>
            {g.cover_image ? <GameThumb src={g.cover_image} alt={g.title} /> : <GameThumbPlaceholder>🎮</GameThumbPlaceholder>}
            <GameTitle>{g.title}</GameTitle>
            <ViewCount><Eye size={11} /> {g.view_count || 0}</ViewCount>
          </GameRow>
        ))}
        {recentGames.length === 0 && <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.4)' }}>No games yet. Add your first game!</p>}
      </Section>
    </div>
  )
}
