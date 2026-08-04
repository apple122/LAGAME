import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ArrowLeft, Download, Monitor, Cpu, ExternalLink, Loader2, Play, AlignLeft, Apple, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Game, DownloadLink, Category } from '../../lib/supabase'
import { useAdSettings } from '../../context/AdSettingsContext'
import { trackGameView } from '../../lib/analytics'

const CLOUD_ICONS: Record<string, string> = {
  'Google Drive': '🟢',
  'MEGA': '🔴',
  'MediaFire': '🔵',
  'OneDrive': '🟦',
  'Dropbox': '📦',
  'Zippyshare': '⚡',
  'Pixeldrain': '💧',
  'default': '☁️',
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const Page = styled.div`max-width: 1100px; margin: 0 auto; padding: 32px 24px;`

const Back = styled(Link)`
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; color: rgba(148,163,184,0.7);
  margin-bottom: 24px; transition: color 0.2s;
  &:hover { color: #e2e8f0; }
`

const Hero = styled.div`
  display: grid; grid-template-columns: 320px 1fr; gap: 32px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`

const CoverImg = styled.img`
  width: 100%; border-radius: 16px;
  border: 1px solid rgba(124,58,237,0.2);
  box-shadow: 0 0 40px rgba(124,58,237,0.2);
  transition: transform 0.3s;
`

const CoverPlaceholder = styled.div`
  width: 100%; aspect-ratio: 3/4;
  border-radius: 16px; background: linear-gradient(135deg, #12121f, #1a1a2e);
  display: flex; align-items: center; justify-content: center;
  font-size: 64px; border: 1px solid rgba(124,58,237,0.2);
`

const Info = styled.div``

const CategoryBadge = styled.span`
  display: inline-flex; align-items: center; padding: 4px 12px;
  border-radius: 999px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  background: rgba(124,58,237,0.15); color: #9d5cf5;
  border: 1px solid rgba(124,58,237,0.25); margin-bottom: 12px;
`

const Title = styled.h1`
  font-family: 'Outfit', sans-serif; font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 900; color: #fff; margin-bottom: 16px; line-height: 1.15;
`

const Description = styled.p`
  font-size: 14px; line-height: 1.7;
  color: rgba(148,163,184,0.8); margin-bottom: 28px;
`

const Section = styled.div`margin-top: 32px;`

const SectionTitle = styled.h2`
  font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700;
  color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  &::after { content: ''; flex: 1; height: 1px; background: rgba(124,58,237,0.2); }
`

const DownloadBtn = styled.button`
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 14px 20px; margin-bottom: 10px;
  background: rgba(18,18,31,0.9); border: 1px solid rgba(124,58,237,0.25);
  border-radius: 12px; cursor: pointer; transition: all 0.2s;
  color: #e2e8f0; text-align: left;
  &:hover { border-color: rgba(124,58,237,0.6); background: rgba(124,58,237,0.1); transform: translateX(4px); }
`

const CloudName = styled.span`font-size: 15px; font-weight: 600; flex: 1;`
const DownArrow = styled.span`font-size: 12px; color: rgba(148,163,184,0.5); display: flex; align-items: center; gap: 4px;`

const SpecGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const SpecCard = styled.div`
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15);
  border-radius: 12px; padding: 18px;
`

const SpecTitle = styled.h4`
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: rgba(148,163,184,0.6); margin-bottom: 14px; display: flex; align-items: center; gap: 6px;
`



// Screenshots gallery
const GalleryWrap = styled.div`position: relative;`
const GalleryScroll = styled.div`
  display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px;
  scroll-snap-type: x mandatory;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: rgba(18,18,31,0.5); }
  &::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 2px; }
`
const Screenshot = styled.img`
  height: 180px; aspect-ratio: 16/9; border-radius: 10px; flex-shrink: 0;
  object-fit: cover; scroll-snap-align: start; cursor: pointer;
  border: 1px solid rgba(124,58,237,0.15);
  transition: border-color 0.2s, transform 0.2s;
  &:hover { border-color: rgba(124,58,237,0.5); transform: scale(1.02); }
`

// Lightbox
const Lightbox = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s ease;
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`

const LightboxNav = styled.button`
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s, transform 0.2s;
  &:hover { background: rgba(124,58,237,0.6); transform: translateY(-50%) scale(1.1); }
  &:disabled { opacity: 0.25; cursor: default; }
`
const LightboxCounter = styled.div`
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
  padding: 5px 14px; font-size: 13px; color: rgba(255,255,255,0.8);
`

const LoadingPage = styled.div`
  display: flex; align-items: center; justify-content: center;
  min-height: 60vh; color: rgba(148,163,184,0.6); gap: 12px; font-size: 14px;
`

export default function GameDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { adSettings } = useAdSettings()
  const [game, setGame] = useState<Game | null>(null)
  const [gameCategories, setGameCategories] = useState<Category[]>([])
  const [links, setLinks] = useState<DownloadLink[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('games')
        .select('*, category:categories(id,name,slug)')
        .eq('slug', slug)
        .single()
      if (!data) { navigate('/'); return }
      setGame(data as any)
      
      let cats = (data as any).category ? [(data as any).category] : []
      const catIds = (data as any).category_ids
      if (catIds && catIds.length > 0) {
        const { data: dbCats } = await supabase.from('categories').select('*').in('id', catIds)
        if (dbCats) cats = [...new Map([...cats, ...dbCats].map(item => [item.id, item])).values()]
      }
      setGameCategories(cats)

      const { data: dl } = await supabase
        .from('download_links')
        .select('*')
        .eq('game_id', (data as any).id)
        .order('sort_order')
      setLinks((dl as any) || [])

      // Track game view by platform (also updates legacy view_count)
      trackGameView((data as any).id, (data as any).view_count || 0)
      setLoading(false)
    }
    fetch()
  }, [slug])

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightbox === null || !game?.screenshots?.length) return
    if (e.key === 'ArrowRight') setLightbox(i => Math.min((i ?? 0) + 1, game.screenshots.length - 1))
    if (e.key === 'ArrowLeft') setLightbox(i => Math.max((i ?? 0) - 1, 0))
    if (e.key === 'Escape') setLightbox(null)
  }, [lightbox, game])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleDownload = (link: DownloadLink) => {
    if (adSettings?.is_active && adSettings.ad_url) {
      const encoded = encodeURIComponent(link.url)
      navigate(`/download-redirect?url=${encoded}&cloud=${encodeURIComponent(link.cloud_name)}`)
    } else {
      window.open(link.url, '_blank', 'noopener')
    }
  }

  if (loading) return <LoadingPage><Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading game...</LoadingPage>
  if (!game) return null

  const sr = game.system_requirements

  return (
    <Page>
      <Back to="/"><ArrowLeft size={15} /> Back to Games</Back>

      <Hero>
        <div>
          {game.cover_image
            ? <CoverImg src={game.cover_image} alt={game.title} />
            : <CoverPlaceholder>🎮</CoverPlaceholder>
          }
        </div>

        <Info>
          {gameCategories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {gameCategories.map(c => <CategoryBadge key={c.id}>{c.name}</CategoryBadge>)}
            </div>
          )}
          <Title>{game.title}</Title>
          {(game as any).file_size && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 8, padding: '6px 12px', marginBottom: 14, fontSize: 13, color: '#c4b5fd'
            }}>
              💾 <strong>Storage:</strong>&nbsp;{(game as any).file_size}
            </div>
          )}
          {game.description && <Description>{game.description.slice(0, 400)}{game.description.length > 400 ? '...' : ''}</Description>}

          {/* Download Links */}
          <SectionTitle><Download size={15} /> Download Links</SectionTitle>
          {links.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>No download links added yet.</p>
          ) : (
            (() => {
              const winLinks: DownloadLink[] = []
              const macLinks: DownloadLink[] = []
              
              links.forEach(link => {
                let platform = 'windows';
                let cloud_name = link.cloud_name;
                if (cloud_name.startsWith('[windows] ')) {
                  platform = 'windows';
                  cloud_name = cloud_name.replace('[windows] ', '');
                } else if (cloud_name.startsWith('[macos] ')) {
                  platform = 'macos';
                  cloud_name = cloud_name.replace('[macos] ', '');
                }
                
                const parsedLink = { ...link, cloud_name };
                if (platform === 'windows') winLinks.push(parsedLink);
                else macLinks.push(parsedLink);
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {winLinks.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(148,163,184,0.7)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Monitor size={14} /> Windows
                      </div>
                      {winLinks.map(link => (
                        <DownloadBtn key={link.id} onClick={() => handleDownload(link)}>
                          <span style={{ fontSize: 20 }}>{CLOUD_ICONS[link.cloud_name] || CLOUD_ICONS.default}</span>
                          <CloudName>{link.cloud_name}</CloudName>
                          <DownArrow><ExternalLink size={12} /> Download</DownArrow>
                        </DownloadBtn>
                      ))}
                    </div>
                  )}
                  {macLinks.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(148,163,184,0.7)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Apple size={14} /> macOS
                      </div>
                      {macLinks.map(link => (
                        <DownloadBtn key={link.id} onClick={() => handleDownload(link)}>
                          <span style={{ fontSize: 20 }}>{CLOUD_ICONS[link.cloud_name] || CLOUD_ICONS.default}</span>
                          <CloudName>{link.cloud_name}</CloudName>
                          <DownArrow><ExternalLink size={12} /> Download</DownArrow>
                        </DownloadBtn>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()
          )}
        </Info>
      </Hero>

      {/* Video Trailer */}
      {game.video_url && getYoutubeId(game.video_url) && (
        <Section>
          <SectionTitle><Play size={15} /> Trailer & Gameplay</SectionTitle>
          <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <iframe 
              width="100%" height="100%" 
              src={`https://www.youtube.com/embed/${getYoutubeId(game.video_url)}`} 
              frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen 
            />
          </div>
        </Section>
      )}

      {/* Screenshots */}
      {game.screenshots?.length > 0 && (
        <Section>
          <SectionTitle>📸 Screenshots</SectionTitle>
          <GalleryWrap>
            <GalleryScroll>
              {game.screenshots.map((src, i) => (
                <Screenshot key={i} src={src} alt={`Screenshot ${i + 1}`} onClick={() => setLightbox(i)} />
              ))}
            </GalleryScroll>
          </GalleryWrap>
        </Section>
      )}

      {/* System Requirements */}
      {sr && (
        <Section>
          <SectionTitle><Monitor size={15} /> System Requirements</SectionTitle>
          <SpecGrid>
            <SpecCard>
              <SpecTitle><Cpu size={12} /> Minimum</SpecTitle>
              {sr.minimum?.about && <div style={{ fontSize: 14, color: 'rgba(226,232,240,0.9)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sr.minimum.about}</div>}
            </SpecCard>
            <SpecCard>
              <SpecTitle><Cpu size={12} /> Recommended</SpecTitle>
              {sr.recommended?.about && <div style={{ fontSize: 14, color: 'rgba(226,232,240,0.9)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sr.recommended.about}</div>}
            </SpecCard>
          </SpecGrid>
        </Section>
      )}

      {/* Full Description */}
      {game.description && (
        <Section>
          <SectionTitle><AlignLeft size={15} /> About This Game</SectionTitle>
          <div style={{ 
            fontSize: 15, color: 'rgba(226,232,240,0.9)', lineHeight: 1.8, whiteSpace: 'pre-wrap', 
            background: 'rgba(18,18,31,0.8)', border: '1px solid rgba(124,58,237,0.15)', 
            borderRadius: 16, padding: '24px 32px' 
          }}>
            {game.description}
          </div>
        </Section>
      )}

      {/* Lightbox */}
      {lightbox !== null && game.screenshots?.length > 0 && (
        <Lightbox onClick={() => setLightbox(null)}>
          <img
            src={game.screenshots[lightbox]}
            alt={`Screenshot ${lightbox + 1}`}
            style={{ maxWidth: '90vw', maxHeight: '82vh', borderRadius: 12, boxShadow: '0 0 60px rgba(0,0,0,0.8)', display: 'block' }}
            onClick={e => e.stopPropagation()}
          />
          {/* Prev */}
          <LightboxNav
            style={{ left: 16 }}
            disabled={lightbox === 0}
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.max((i ?? 1) - 1, 0)) }}
          >
            <ChevronLeft size={26} />
          </LightboxNav>
          {/* Next */}
          <LightboxNav
            style={{ right: 16 }}
            disabled={lightbox === game.screenshots.length - 1}
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.min((i ?? 0) + 1, game.screenshots.length - 1)) }}
          >
            <ChevronRight size={26} />
          </LightboxNav>
          {/* Counter */}
          <LightboxCounter>{lightbox + 1} / {game.screenshots.length}</LightboxCounter>
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 14, backdropFilter: 'blur(4px)' }}
          >✕ Close</button>
        </Lightbox>
      )}
    </Page>
  )
}
