import { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { Rocket, Clock, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Game } from '../../lib/supabase'
import Seo from '../../components/Seo'

// ─── Types ─────────────────────────────────────────────────────
interface EpicFreeGame {
  id: string
  title: string
  coverImage: string
  startDate: string
  endDate: string
  epicUrl: string
  isUpcoming: boolean // false = free now, true = upcoming free
}

interface SteamGame {
  id: number
  name: string
  large_capsule_image: string
}


// ─── Cache (localStorage, 24h TTL) ────────────────────────────
const CACHE_KEY = 'epic_free_games_v2'
const CACHE_TTL = 24 * 60 * 60 * 1000

function getCached(): EpicFreeGame[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCached(data: EpicFreeGame[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

// ─── Epic Games fetcher (no API key needed) ────────────────────
async function fetchEpicGames(force = false): Promise<EpicFreeGame[]> {
  if (!force) {
    const hit = getCached()
    if (hit) return hit
  }

  const targetUrl = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=th&country=TH&allowCountries=TH'
  const epicUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`

  const res = await fetch(epicUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = json?.data?.Catalog?.searchStore?.elements ?? []

  const results: EpicFreeGame[] = []

  for (const el of elements) {
    if (!el.promotions) continue

    const img =
      el.keyImages?.find((i: { type: string }) => i.type === 'OfferImageTall')?.url ||
      el.keyImages?.find((i: { type: string }) => i.type === 'DieselGameBoxTall')?.url ||
      el.keyImages?.find((i: { type: string }) => i.type === 'Thumbnail')?.url ||
      el.keyImages?.[0]?.url || ''

    const slug =
      el.catalogNs?.mappings?.find((m: { pageType: string }) => m.pageType === 'productHome')?.pageSlug ||
      el.productSlug || el.urlSlug || ''

    const link = slug
      ? `https://store.epicgames.com/en-US/p/${slug}`
      : 'https://store.epicgames.com/en-US/free-games'

    // Current free offers
    for (const bucket of (el.promotions?.promotionalOffers ?? [])) {
      for (const offer of (bucket.promotionalOffers ?? [])) {
        if (offer.discountSetting?.discountPercentage === 0) {
          results.push({
            id: `${el.id}-now`,
            title: el.title,
            coverImage: img,
            startDate: offer.startDate,
            endDate: offer.endDate,
            epicUrl: link,
            isUpcoming: false,
          })
        }
      }
    }

    // Upcoming free offers
    for (const bucket of (el.promotions?.upcomingPromotionalOffers ?? [])) {
      for (const offer of (bucket.promotionalOffers ?? [])) {
        if (offer.discountSetting?.discountPercentage === 0) {
          results.push({
            id: `${el.id}-soon`,
            title: el.title,
            coverImage: img,
            startDate: offer.startDate,
            endDate: offer.endDate,
            epicUrl: link,
            isUpcoming: true,
          })
        }
      }
    }
  }

  // Deduplicate by title
  const seen = new Set<string>()
  const unique = results.filter(g => {
    const k = g.title + g.isUpcoming
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // Sort: upcoming first
  unique.sort((a, b) => (a.isUpcoming === b.isUpcoming ? 0 : a.isUpcoming ? -1 : 1))

  setCached(unique)
  return unique
}

async function fetchSteamUpcoming(): Promise<SteamGame[]> {
  try {
    const url = 'https://store.steampowered.com/search/results?filter=popularwishlist&os=win&infinite=1'
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`)
    if (!res.ok) return []
    const data = await res.json()
    const html = data?.results_html || ''

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const rows = doc.querySelectorAll('.search_result_row')

    return Array.from(rows).slice(0, 15).map(row => {
      const imgElem = row.querySelector('.search_capsule img') as HTMLImageElement
      const titleElem = row.querySelector('.title')
      const appId = parseInt(row.getAttribute('data-ds-appid') || '0', 10)
      let capsule = imgElem?.src || ''
      if (capsule) {
        // use high res capsule if possible
        capsule = capsule.replace('capsule_231x87', 'capsule_616x353')
      }
      return {
        id: appId,
        name: titleElem?.textContent || 'Unknown',
        large_capsule_image: capsule
      }
    })
  } catch {
    return []
  }
}


// ─── Helpers ───────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Animations ────────────────────────────────────────────────
const float = keyframes`
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-7px)}
`
const shimmer = keyframes`
  0%{background-position:-200% center}
  100%{background-position:200% center}
`
const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`

const SpinIcon = styled.span`
  display: inline-flex;
  animation: ${spin} 0.8s linear infinite;
`
const SpinRefreshIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  ${p => p.$active && css`
    animation: ${spin} 0.8s linear infinite;
  `}
`

// ─── Styled Components ─────────────────────────────────────────
const HeroBanner = styled.div`
  background:
    linear-gradient(to bottom,rgba(8,8,16,.5) 0%,rgba(8,8,16,.96) 100%),
    url('/bg.jpg') center 38%/cover no-repeat;
  padding: 56px 24px 48px;
  text-align: center;
  position: relative;
  overflow: hidden;
  &::before {
    content:'';
    position:absolute;inset:0;
    background:radial-gradient(ellipse at center top,rgba(124,58,237,.18) 0%,transparent 60%);
  }
  >*{position:relative;z-index:1}
`
const HeroIconWrap = styled.div`
  font-size:56px;
  line-height:1;
  margin-bottom:12px;
  animation:${float} 3s ease-in-out infinite;
`
const HeroTitle = styled.h1`
  font-family:'Noto Sans Lao',sans-serif;
  font-size:clamp(1.8rem,4vw,3rem);
  font-weight:900;
  margin-bottom:10px;
  background:linear-gradient(135deg,#fff 0%,#a855f7 50%,#06b6d4 100%);
  background-size:200% auto;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:${shimmer} 3s linear infinite;
`
const HeroSub = styled.p`
  color:rgba(148,163,184,.8);
  font-size:15px;
  max-width:520px;
  margin:0 auto;
`
const Wrap = styled.div`
  max-width:1280px;
  margin:0 auto;
  padding:0 20px 60px;
`
const Section = styled.section`margin-bottom:48px`

const SectionHeader = styled.div`
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:20px;
  padding-bottom:12px;
  border-bottom:1px solid rgba(124,58,237,.15);
`
const SectionTitle = styled.h2`
  font-size:18px;font-weight:700;color:#e2e8f0;margin:0;
  display:flex;align-items:center;gap:8px;
`
const Badge = styled.span`
  font-size:11px;font-weight:600;padding:3px 10px;
  border-radius:99px;background:rgba(124,58,237,.2);
  color:#a855f7;border:1px solid rgba(124,58,237,.3);
`
const RefreshBtn = styled.button`
  margin-left:auto;
  display:flex;align-items:center;gap:6px;
  padding:6px 14px;border-radius:8px;
  background:rgba(124,58,237,.15);
  border:1px solid rgba(124,58,237,.3);
  color:#a855f7;font-size:12px;font-weight:600;
  cursor:pointer;transition:all .2s;
  &:hover{background:rgba(124,58,237,.25)}
  &:disabled{opacity:.5;cursor:not-allowed}
`
const StatusRow = styled.div`
  display:flex;align-items:center;gap:10px;
  color:rgba(148,163,184,.6);font-size:13px;padding:20px 0;
`
const ErrorBox = styled.div`
  padding:18px;border-radius:12px;
  background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);
  color:rgba(239,68,68,.9);font-size:13px;
`

// Epic card grid
const EpicGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(190px,1fr));
  gap:20px;
  @media(max-width:640px){grid-template-columns:repeat(2,1fr);gap:12px}
`
const EpicCard = styled.a<{ $now: boolean }>`
  display:block;border-radius:14px;overflow:hidden;
  background:rgba(18,18,31,.9);
  border:1px solid ${p => p.$now ? 'rgba(34,197,94,.25)' : 'rgba(251,191,36,.25)'};
  text-decoration:none;
  transition:transform .25s,box-shadow .25s,border-color .25s;
  position:relative;
  &:hover{
    transform:translateY(-4px);
    box-shadow:0 12px 32px ${p => p.$now ? 'rgba(34,197,94,.18)' : 'rgba(251,191,36,.18)'};
    border-color:${p => p.$now ? 'rgba(34,197,94,.5)' : 'rgba(251,191,36,.5)'};
  }
`
const EpicImgWrap = styled.div`position:relative;aspect-ratio:3/4;overflow:hidden;background:#0d0d1a`
const EpicImg = styled.img`
  width:100%;height:100%;object-fit:cover;
  transition:transform .4s ease;
  ${EpicCard}:hover &{transform:scale(1.05)}
`
const EpicBadge = styled.div<{ $now: boolean }>`
  position:absolute;top:8px;left:8px;
  font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px;
  background:${p => p.$now ? 'rgba(34,197,94,.9)' : 'rgba(251,191,36,.9)'};
  color:#000;text-transform:uppercase;letter-spacing:.5px;
  backdrop-filter:blur(4px);
`
const EpicSource = styled.div`
  position:absolute;bottom:8px;right:8px;
  font-size:9px;font-weight:700;padding:3px 7px;
  border-radius:5px;background:rgba(0,0,0,.7);
  color:rgba(255,255,255,.7);letter-spacing:.5px;
`
const EpicBody = styled.div`padding:12px`
const EpicTitle = styled.div`
  font-size:13px;font-weight:700;color:#e2e8f0;
  margin-bottom:6px;line-height:1.3;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
`
const EpicDate = styled.div`
  font-size:11px;color:rgba(148,163,184,.7);
  display:flex;align-items:center;gap:5px;
`


// ─── Component ─────────────────────────────────────────────────
export default function ComingSoonPage() {
  const [nowGames, setNowGames] = useState<EpicFreeGame[]>([])
  const [soonGames, setSoonGames] = useState<EpicFreeGame[]>([])
  const [epicLoading, setEpicLoading] = useState(true)
  const [epicError, setEpicError] = useState('')
  const [localGames, setLocalGames] = useState<Game[]>([])
  const [localLoading, setLocalLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Steam (Global Upcoming) state
  const [steamGames, setSteamGames] = useState<SteamGame[]>([])
  const [steamLoading, setSteamLoading] = useState(true)

  const loadEpic = async (force = false) => {
    if (force) setRefreshing(true)
    setEpicLoading(true)
    setEpicError('')
    try {
      const data = await fetchEpicGames(force)
      setNowGames(data.filter(g => !g.isUpcoming))
      setSoonGames(data.filter(g => g.isUpcoming))
    } catch (e: unknown) {
      setEpicError(e instanceof Error ? e.message : 'ดึงข้อมูลไม่สำเร็จ')
    } finally {
      setEpicLoading(false)
      setRefreshing(false)
    }
  }

  const loadAll = async () => {
    setLocalLoading(true)
    setEpicLoading(true)
    setSteamLoading(true)
    Promise.allSettled([
      supabase.from('games').select('*, categories(*)').eq('is_coming_soon', true).order('created_at', { ascending: false }),
      fetchEpicGames(false),
      fetchSteamUpcoming()
    ]).then(([localRes, epicRes, steamRes]) => {
      if (localRes.status === 'fulfilled') {
        setLocalGames((localRes.value.data as any) || [])
      }
      setLocalLoading(false)

      if (epicRes.status === 'fulfilled') {
        const now = epicRes.value.filter(g => !g.isUpcoming)
        const soon = epicRes.value.filter(g => g.isUpcoming)
        setNowGames(now)
        setSoonGames(soon)
      } else {
        setEpicError('ดึงข้อมูลไม่สำเร็จ')
      }
      setEpicLoading(false)

      if (steamRes.status === 'fulfilled') {
        setSteamGames(steamRes.value)
      }
      setSteamLoading(false)
    })
  }

  useEffect(() => {
    loadAll()
  }, [])

  return (
    <>
      <Seo
        title="Coming Soon & Free Games"
        description="เกมที่กำลังจะมาถึงและเกมแจกฟรีจาก Epic Games Store พร้อมเกม Coming Soon จากคลังของเรา"
        keywords="coming soon games, epic games free, เกมแจกฟรี"
        path="/coming-soon"
      />

      <HeroBanner>
        <HeroIconWrap>🚀</HeroIconWrap>
        <HeroTitle>Coming Soon & Free Games</HeroTitle>
        <HeroSub>เกมแจกฟรีและที่กำลังจะมาถึงจาก Epic Games Store · อัปเดตทุก 24 ชั่วโมง</HeroSub>
      </HeroBanner>

      <Wrap>

        {/* ── Epic: Free Now (Separate from Coming Soon) ──────────────────────────────── */}
        <Section>
          <SectionHeader>
            <SectionTitle>
              <span style={{ color: '#0078f2', fontWeight: 800, fontSize: 13 }}>EPIC</span>
              🎮 แจกฟรีตอนนี้ / เร็วๆ นี้
            </SectionTitle>
            {!epicLoading && <Badge>{nowGames.length + soonGames.length} เกม</Badge>}
            <RefreshBtn onClick={() => loadEpic(true)} disabled={refreshing || epicLoading}>
              <SpinRefreshIcon $active={refreshing}><RefreshCw size={12} /></SpinRefreshIcon>
              {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
            </RefreshBtn>
          </SectionHeader>

          {epicLoading ? (
            <StatusRow>
              <SpinIcon><Loader2 size={16} /></SpinIcon>
              กำลังดึงข้อมูลจาก Epic Games Store...
            </StatusRow>
          ) : epicError ? (
            <ErrorBox>⚠️ {epicError} — ลองกด "รีเฟรช" อีกครั้ง</ErrorBox>
          ) : (nowGames.length === 0 && soonGames.length === 0) ? (
            <StatusRow>ไม่มีเกมแจกฟรีในขณะนี้</StatusRow>
          ) : (
            <EpicGrid>
              {nowGames.map(g => (
                <EpicCard key={g.id} href={g.epicUrl} target="_blank" rel="noopener noreferrer" $now>
                  <EpicImgWrap>
                    <EpicImg src={g.coverImage} alt={g.title} loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '.3' }} />
                    <EpicBadge $now>🎁 แจกฟรีแล้ว</EpicBadge>
                    <EpicSource>EPIC GAMES</EpicSource>
                  </EpicImgWrap>
                  <EpicBody>
                    <EpicTitle title={g.title}>{g.title}</EpicTitle>
                    <EpicDate><Clock size={11} /> ถึง {fmtDate(g.endDate)}</EpicDate>
                  </EpicBody>
                </EpicCard>
              ))}
              {soonGames.map(g => (
                <EpicCard key={g.id} href={g.epicUrl} target="_blank" rel="noopener noreferrer" $now={false}>
                  <EpicImgWrap>
                    <EpicImg src={g.coverImage} alt={g.title} loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '.3' }} />
                    <EpicBadge $now={false} style={{ background: '#0078f2', color: '#fff', border: 'none' }}>
                      🎁 แจกฟรีเร็วๆ นี้
                    </EpicBadge>
                    <EpicSource>EPIC GAMES</EpicSource>
                  </EpicImgWrap>
                  <EpicBody style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <EpicTitle title={g.title}>{g.title}</EpicTitle>
                    <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 'bold', marginTop: '6px', lineHeight: 1.4 }}>
                      กำลังจะมีการแจกฟรีในเร็วๆ นี้<br />ในวันที่ {fmtDate(g.startDate)}
                    </div>
                  </EpicBody>
                </EpicCard>
              ))}
            </EpicGrid>
          )}
        </Section>

        {/* ── Unified Coming Soon Grid ────────────────────────────── */}
        <Section>
          <SectionHeader>
            <SectionTitle><Rocket size={18} style={{ color: '#fbbf24' }} /> 🔜 Coming Soon (เกมที่กำลังจะมา)</SectionTitle>
            {(!localLoading && !epicLoading && !steamLoading) && (
              <Badge>{localGames.length + steamGames.length} เกม</Badge>
            )}
          </SectionHeader>

          {(localLoading || epicLoading || steamLoading) ? (
            <StatusRow>
              <SpinIcon><Loader2 size={16} /></SpinIcon>
              กำลังดึงข้อมูลทั้งหมด...
            </StatusRow>
          ) : (localGames.length === 0 && steamGames.length === 0) ? (
            <StatusRow>ยังไม่มีเกมที่จะเข้ามาใหม่ในขณะนี้</StatusRow>
          ) : (
            <EpicGrid>
              {/* Local Games First */}
              {localGames.map(g => (
                <EpicCard key={`local-${g.id}`} href={`/game/${g.slug}`} $now={false}>
                  <EpicImgWrap>
                    <EpicImg src={g.cover_image || undefined} alt={g.title} loading="lazy" style={{ objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '.3' }} />
                    <EpicBadge $now={false} style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000' }}>
                      🚀 เตรียมเข้าคลัง
                    </EpicBadge>
                    <EpicSource style={{ background: '#7c3aed' }}>OUR LIBRARY</EpicSource>
                  </EpicImgWrap>
                  <EpicBody>
                    <EpicTitle title={g.title}>{g.title}</EpicTitle>
                    <EpicDate><Clock size={11} /> เร็วๆ นี้</EpicDate>
                  </EpicBody>
                </EpicCard>
              ))}

              {/* Steam Games Soon */}
              {steamGames.map(g => (
                <EpicCard key={`steam-${g.id}`} href={`https://store.steampowered.com/app/${g.id}`} target="_blank" rel="noopener noreferrer" $now={false}>
                  <EpicImgWrap>
                    <EpicImg src={g.large_capsule_image} alt={g.name} loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '.3' }} />
                    <EpicBadge $now={false} style={{ background: '#171a21', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      🌍 ยอดฮิต (Steam)
                    </EpicBadge>
                    <EpicSource style={{ background: '#171a21' }}>STEAM</EpicSource>
                  </EpicImgWrap>
                  <EpicBody>
                    <EpicTitle title={g.name}>{g.name}</EpicTitle>
                    <EpicDate><Clock size={11} /> กำลังมาแรง</EpicDate>
                  </EpicBody>
                </EpicCard>
              ))}
            </EpicGrid>
          )}
        </Section>



        {/* ── Attribution ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', color: 'rgba(148,163,184,.4)', fontSize: 12, marginTop: 20 }}>
          ข้อมูลจาก{' '}
          <a href="https://store.epicgames.com/en-US/free-games" target="_blank" rel="noopener noreferrer"
            style={{ color: '#0078f2', textDecoration: 'none' }}>
            Epic Games Store <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </a>
          {' '}· Cache 24 ชั่วโมง
        </div>
      </Wrap>
    </>
  )
}
