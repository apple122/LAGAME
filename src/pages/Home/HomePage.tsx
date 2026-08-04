import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { Filter, Gamepad2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Game, Category } from '../../lib/supabase'
import GameCard from '../../components/GameCard/GameCard'

const PAGE_SIZE = 100

const Hero = styled.div`
  background: 
    linear-gradient(to bottom, rgba(8,8,16,0.55) 0%, rgba(8,8,16,0.92) 100%),
    url('/bg.jpg') center 38%/cover no-repeat;
  border-bottom: 0px solid rgba(124,58,237,0.15);
  padding: 64px 24px 56px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    background: 
      linear-gradient(to bottom, rgba(8,8,16,0.55) 0%, rgba(8,8,16,0.92) 100%),
      url('/bg.jpg') center 40%/cover no-repeat;
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(8,8,16,0.7) 100%);
  }
  
  > * { position: relative; z-index: 1; }
`

const HeroTitle = styled.h1`
  font-family: 'Outfit', sans-serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
  line-height: 1.1;
  text-shadow: 0 4px 20px rgba(0,0,0,0.5);
`

const HeroSub = styled.p`
  font-size: 16px;
  color: rgba(148,163,184,0.8);
  max-width: 500px;
  margin: 0 auto;
`

const HeroStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-top: 28px;
  flex-wrap: wrap;
`

const Stat = styled.div`
  text-align: center;
`

const StatNum = styled.div`
  font-family: 'Outfit', sans-serif;
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(148,163,184,0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const PageWrap = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`

const Sidebar = styled.aside`
  @media (max-width: 900px) { display: none; }
`

const SidebarCard = styled.div`
  background: rgba(18,18,31,0.8);
  border: 1px solid rgba(124,58,237,0.15);
  border-radius: 14px;
  padding: 20px;
  position: sticky;
  top: 90px;
`

const SidebarTitle = styled.h3`
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(148,163,184,0.6);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`

const CatBtn = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${p => p.$active ? 600 : 400};
  color: ${p => p.$active ? '#fff' : 'rgba(148,163,184,0.8)'};
  background: ${p => p.$active ? 'rgba(124,58,237,0.25)' : 'transparent'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.15s;
  margin-bottom: 2px;
  &:hover { background: rgba(124,58,237,0.15); color: #fff; }
`

const Content = styled.div``

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const SortSelect = styled.select`
  padding: 8px 14px;
  background: rgba(18,18,31,0.8);
  border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  &:focus { border-color: rgba(124,58,237,0.5); }
`

const ResultCount = styled.span`
  font-size: 13px;
  color: rgba(148,163,184,0.6);
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 24px;
  color: rgba(148,163,184,0.5);
`

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 40px;
`

const PageBtn = styled.button<{ $active?: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid ${p => p.$active ? '#7c3aed' : 'rgba(124,58,237,0.2)'};
  background: ${p => p.$active ? 'rgba(124,58,237,0.3)' : 'rgba(18,18,31,0.8)'};
  color: ${p => p.$active ? '#fff' : 'rgba(148,163,184,0.7)'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover:not(:disabled) { background: rgba(124,58,237,0.2); color: #fff; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`

const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: rgba(148,163,184,0.6);
  gap: 12px;
  font-size: 14px;
`



export default function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [sort, setSort] = useState('created_at_desc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [allGamesCount, setAllGamesCount] = useState(0)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    const loadCategoriesAndCounts = async () => {
      const [catsRes, gamesRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('games').select('category_id, category_ids')
      ])
      
      setCategories(catsRes.data || [])
      
      const counts: Record<string, number> = {}
      const allGames = (gamesRes.data as any[]) || []
      setAllGamesCount(allGames.length)
      
      allGames.forEach(g => {
        const catIds = new Set<string>()
        if (g.category_id) catIds.add(g.category_id)
        if (g.category_ids) g.category_ids.forEach((id: string) => catIds.add(id))
        
        catIds.forEach(id => {
          counts[id] = (counts[id] || 0) + 1
        })
      })
      
      setCategoryCounts(counts)
    }
    loadCategoriesAndCounts()
  }, [])

  useEffect(() => {
    fetchGames()
  }, [selectedCat, sort, page])

  const fetchGames = async () => {
    setLoading(true)
    const [orderCol, orderDir] = sort === 'created_at_desc'
      ? ['created_at', false]
      : sort === 'title_asc' ? ['title', true] : ['view_count', false]

    let q = supabase
      .from('games')
      .select('*, category:categories(id,name,slug), download_links(id)', { count: 'exact' })
      .order(orderCol, { ascending: orderDir as boolean })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (selectedCat) q = q.or(`category_id.eq.${selectedCat},category_ids.cs.{${selectedCat}}`)

    const { data, count } = await q
    setGames((data as any) || [])
    setTotal(count || 0)
    setLoading(false)
  }

  return (
    <>
      {/* Hero Banner */}
      <Hero>
        <HeroTitle>
          <img src="/game-2-svgrepo-com.svg" alt="Gamepad" style={{ width: 64, height: 64, filter: 'brightness(0) invert(1) drop-shadow(0 4px 12px rgba(124,58,237,0.5))' }} />
          Game Hub
        </HeroTitle>
        <HeroSub>Download your favorite PC games — free, fast, and easy.</HeroSub>
        <HeroStats>
          <Stat><StatNum>{total}+</StatNum><StatLabel>Games</StatLabel></Stat>
          <Stat><StatNum>{categories.length}</StatNum><StatLabel>Categories</StatLabel></Stat>
          <Stat><StatNum>Free</StatNum><StatLabel>Always</StatLabel></Stat>
        </HeroStats>
      </Hero>

      <PageWrap>
        {/* Sidebar */}
        <Sidebar>
          <SidebarCard>
            <SidebarTitle><Filter size={12} /> Categories</SidebarTitle>
            <CatBtn $active={selectedCat === null} onClick={() => { setSelectedCat(null); setPage(1) }}>
              All Games
              <span style={{ fontSize: 11, background: selectedCat === null ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: 6, minWidth: 20, textAlign: 'center' }}>
                {allGamesCount}
              </span>
            </CatBtn>
            {categories.map(cat => (
              <CatBtn key={cat.id} $active={selectedCat === cat.id} onClick={() => { setSelectedCat(cat.id); setPage(1) }}>
                {cat.name}
                {categoryCounts[cat.id] > 0 && (
                  <span style={{ fontSize: 11, background: selectedCat === cat.id ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: 6, minWidth: 20, textAlign: 'center' }}>
                    {categoryCounts[cat.id]}
                  </span>
                )}
              </CatBtn>
            ))}
          </SidebarCard>
        </Sidebar>

        {/* Main Content */}
        <Content>
          <Toolbar>
            <ToolbarLeft>
              <Gamepad2 size={18} style={{ color: '#7c3aed' }} />
              <ResultCount>{total} games found</ResultCount>
            </ToolbarLeft>
            <SortSelect value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}>
              <option value="created_at_desc">Newest First</option>
              <option value="title_asc">A-Z</option>
              <option value="view_count_desc">Most Viewed</option>
            </SortSelect>
          </Toolbar>

          {loading ? (
            <LoadingOverlay>
              <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
              Loading games...
            </LoadingOverlay>
          ) : games.length === 0 ? (
            <EmptyState>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No games yet</p>
              <p style={{ fontSize: 13 }}>Add some games from the admin panel!</p>
            </EmptyState>
          ) : (
            <Grid>
              {games.map((g, i) => <GameCard key={g.id} game={g as any} index={i} />)}
            </Grid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PageBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={16} /></PageBtn>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1
                return <PageBtn key={p} $active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
              })}
              <PageBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={16} /></PageBtn>
            </Pagination>
          )}
        </Content>
      </PageWrap>
    </>
  )
}
