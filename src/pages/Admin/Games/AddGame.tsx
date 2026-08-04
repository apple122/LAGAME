import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Sparkles, Plus, Minus, Save, ArrowLeft, Loader2, CheckCircle, AlertCircle, X, Image, Bot, Wand2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Category } from '../../../lib/supabase'
import MultiSelectCategory from '../../../components/MultiSelectCategory'
import { uploadImage } from '../../../lib/supabase'
import { generateGameData } from '../../../lib/gemini'

const CLOUD_OPTIONS = ['Google Drive', 'MEGA', 'MediaFire', 'OneDrive', 'Dropbox', 'Zippyshare', 'Pixeldrain', 'DataNodes', 'Gofile', 'Other']

const Page = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 8px;
  @media (max-width: 480px) { padding: 0 4px; }
`

const BackBtn = styled.button`
  display: flex; align-items: center; gap: 6px; background: none; border: none;
  color: rgba(148,163,184,0.7); font-size: 13px; cursor: pointer; margin-bottom: 20px;
  &:hover { color: #fff; }
`

const FormCard = styled.div`
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15);
  border-radius: 16px; padding: 28px;
  @media (max-width: 600px) { padding: 16px 14px; border-radius: 12px; }
`

const SectionTitle = styled.h3`
  font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: rgba(148,163,184,0.5); margin-bottom: 16px; margin-top: 24px;
  display: flex; align-items: center; gap: 6px;
  &:first-child { margin-top: 0; }
`

const Field = styled.div`margin-bottom: 16px;`
const Label = styled.label`display: block; font-size: 13px; font-weight: 600; color: rgba(148,163,184,0.8); margin-bottom: 6px;`
const Input = styled.input`
  width: 100%; padding: 10px 14px;
  background: rgba(8,8,16,0.8); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(148,163,184,0.4); }
`
const TextArea = styled.textarea`
  width: 100%; padding: 10px 14px; min-height: 120px; resize: vertical;
  background: rgba(8,8,16,0.8); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none;
  font-family: 'Inter', sans-serif; line-height: 1.6;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(148,163,184,0.4); }
`

const FetchRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  @media (max-width: 480px) { gap: 6px; }
`
const FetchBtn = styled.button`
  flex-shrink: 0; display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; background: linear-gradient(135deg, #7c3aed, #06b6d4);
  border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: opacity 0.2s;
  &:hover { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; }
  @media (max-width: 480px) { padding: 10px 12px; font-size: 12px; }
`



const CoverPreview = styled.div`
  margin-top: 10px; width: 140px; height: 196px; border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(124,58,237,0.3); background: rgba(8,8,16,0.8);
`
const CoverImg = styled.img`width: 100%; height: 100%; object-fit: cover;`

const UploadBtn = styled.label`
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 14px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
  border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all 0.2s;
  &:hover { background: rgba(124,58,237,0.3); }
  &.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  @media (max-width: 480px) { padding: 10px 12px; font-size: 12px; }
`

const ScreenshotList = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;`
const ScreenshotThumb = styled.div<{ $dragging?: boolean }>`
  position: relative;
  cursor: grab;
  opacity: ${p => p.$dragging ? 0.4 : 1};
  transition: opacity 0.2s;
  &:active { cursor: grabbing; }
`
const RemoveBtn = styled.button`
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
  background: #ef4444; border: none; border-radius: 50%; color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px;
`

const LinkRow = styled.div`
  display: flex; gap: 8px; margin-bottom: 8px; align-items: center;
  @media (max-width: 480px) { flex-wrap: wrap; }
`
const CloudSelect = styled.select`
  padding: 9px 10px; background: rgba(8,8,16,0.8); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; color: #e2e8f0; font-size: 13px; outline: none; flex-shrink: 0; width: 150px;
  &:focus { border-color: rgba(124,58,237,0.5); }
  @media (max-width: 480px) { width: 100%; }
`
const LinkInput = styled.input`
  flex: 1; padding: 9px 12px; background: rgba(8,8,16,0.8); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; color: #e2e8f0; font-size: 13px; outline: none;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(148,163,184,0.4); }
`
const IconBtn = styled.button`
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; border: 1px solid rgba(124,58,237,0.2); background: transparent;
  color: rgba(148,163,184,0.6); cursor: pointer; flex-shrink: 0; transition: all 0.15s;
  &:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }
`

const AddLinkBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: rgba(124,58,237,0.1); border: 1px dashed rgba(124,58,237,0.3);
  border-radius: 8px; color: rgba(148,163,184,0.7); font-size: 13px; cursor: pointer; transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.15); color: #fff; }
`

const SaveBtn = styled.button`
  display: flex; align-items: center; gap: 8px; padding: 12px 28px; margin-top: 24px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4); border: none; border-radius: 10px;
  color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%;
  justify-content: center; font-family: 'Outfit', sans-serif; transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Alert = styled.div<{ $type: 'success' | 'error' }>`
  display: flex; align-items: center; gap: 8px; padding: 12px 16px;
  border-radius: 10px; margin-bottom: 20px; font-size: 13px; font-weight: 500;
  background: ${p => p.$type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
  border: 1px solid ${p => p.$type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
  color: ${p => p.$type === 'success' ? '#22c55e' : '#ef4444'};
`

const SpecGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px; @media(max-width:600px){grid-template-columns:1fr;}`
const TwoColGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 16px; @media(max-width:600px){grid-template-columns:1fr; gap: 0;}`
const AiSearchRow = styled.div`
  display: flex; gap: 10px; width: 100%;
  @media (max-width: 600px) { flex-direction: column; }
`

const AiBadge = styled.div`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15));
  border: 1px solid rgba(124,58,237,0.3); border-radius: 999px;
  font-size: 11px; font-weight: 700; color: #a855f7; text-transform: uppercase; letter-spacing: 0.5px;
`

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4), 0 0 20px rgba(124,58,237,0.1); }
  50% { box-shadow: 0 0 0 4px rgba(124,58,237,0.1), 0 0 40px rgba(124,58,237,0.2); }
`

const AiGenerateBtn = styled.button<{ $loading?: boolean }>`
  flex-shrink: 0; display: flex; align-items: center; gap: 8px;
  padding: 11px 20px;
  background: ${p => p.$loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #a855f7)'};
  border: none; border-radius: 10px; color: #fff; font-size: 14px; font-weight: 700;
  cursor: ${p => p.$loading ? 'not-allowed' : 'pointer'};
  white-space: nowrap; font-family: 'Outfit', sans-serif;
  transition: all 0.2s;
  ${p => p.$loading ? '' : '&:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }'}
  animation: ${p => p.$loading ? glowPulse : 'none'} 1.5s ease-in-out infinite;
`

const AiResultCard = styled.div`
  margin-top: 14px; padding: 16px; background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05));
  border: 1px solid rgba(124,58,237,0.25); border-radius: 12px; font-size: 13px;
  color: rgba(148,163,184,0.8);
`
const AiResultRow = styled.div`display: flex; gap: 8px; margin-bottom: 6px; align-items: flex-start;`
const AiResultKey = styled.span`color: #a855f7; font-weight: 700; min-width: 90px; flex-shrink: 0;`
const AiResultVal = styled.span`color: #e2e8f0; line-height: 1.5;`

type LinkItem = { cloud_name: string; url: string; platform?: string }

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AddGame() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  // Gemini AI search
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiPreview, setAiPreview] = useState<any>(null)
  const [selectedModel, setSelectedModel] = useState('gemini-flash-latest')
  // Form fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [newScreenshot, setNewScreenshot] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [isFeatured, setIsFeatured] = useState(false)
  // System requirements
  const [platforms, setPlatforms] = useState<string[]>(['windows'])
  const [minAbout, setMinAbout] = useState('')
  const [recAbout, setRecAbout] = useState('')
  // Download links
  const [links, setLinks] = useState<LinkItem[]>([{ cloud_name: 'Google Drive', url: '', platform: 'windows' }])
  // Save state
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Upload state  — files are staged locally, uploaded only on Save
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [pendingScreenshotFiles, setPendingScreenshotFiles] = useState<Map<string, File>>(new Map())
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []))
  }, [])

  // Auto-generate slug from title
  useEffect(() => { setSlug(slugify(title)) }, [title])

  // ── Gemini AI Auto-Fill ─────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true); setAiError(''); setAiPreview(null)
    try {
      const prompt = `You are a game database expert. Given the game name "${aiQuery.trim()}", return a JSON object with the following fields:
{
  "title": "official game title",
  "description": "a 2-3 paragraph description of the game (plot, gameplay, features)",
  "genres": ["genre1", "genre2"] (list of genres e.g. Action, RPG, Strategy, Sports, Racing, Shooter, Adventure, Simulation, Horror, Puzzle, Fighting, Platform),
  "file_size": "estimated game size e.g. 50 GB, 120 GB, 500 MB (just the number and unit)",
  "video_url": "YouTube trailer URL if available (optional)",
  "minimum_requirements": "OS: Windows 10 64-bit\nCPU: Intel Core i5-8400\nRAM: 8 GB\nGPU: NVIDIA GTX 970",
  "recommended_requirements": "OS: Windows 10/11 64-bit\nCPU: Intel Core i7-8700K\nRAM: 16 GB\nGPU: NVIDIA RTX 2080"
}
Return ONLY the raw JSON object. No markdown, no code blocks, no explanation.`

      const data = await generateGameData(prompt, selectedModel)
      setAiPreview(data)
    } catch (e: any) {
      console.error(e)
      setAiError(e.message || 'Failed to generate with AI')
    }
    setAiLoading(false)
  }

  const handleAiApply = async () => {
    if (!aiPreview) return
    setTitle(aiPreview.title || title)
    if (aiPreview.title) setSlug(slugify(aiPreview.title))
    if (aiPreview.description) setDescription(aiPreview.description)
    if (aiPreview.file_size) setFileSize(aiPreview.file_size)
    if (aiPreview.video_url) setVideoUrl(aiPreview.video_url)
    if (aiPreview.minimum_requirements) setMinAbout(aiPreview.minimum_requirements)
    if (aiPreview.recommended_requirements) setRecAbout(aiPreview.recommended_requirements)

    // Auto-match or create categories from genres
    if (aiPreview.genres && aiPreview.genres.length > 0) {
      const newCatIds: string[] = []
      const updatedCats = [...categories]
      for (const genreName of aiPreview.genres) {
        const name = genreName.trim()
        const slug = slugify(name)
        let existing = updatedCats.find(c => c.slug === slug || c.name.toLowerCase() === name.toLowerCase())
        if (!existing) {
          try {
            const { data } = await supabase.from('categories').insert({ name, slug } as any).select().single()
            if (data) { updatedCats.push(data as Category); existing = data as Category }
          } catch { /* skip dup */ }
        }
        if (existing && !newCatIds.includes(existing.id)) newCatIds.push(existing.id)
      }
      setCategories(updatedCats.sort((a, b) => a.name.localeCompare(b.name)))
      setCategoryIds(newCatIds)
    }
    setAiPreview(null)
  }

  const addLink = () => setLinks(l => [...l, { cloud_name: 'Google Drive', url: '', platform: 'windows' }])
  const removeLink = (i: number) => setLinks(l => l.filter((_, idx) => idx !== i))
  const updateLink = (i: number, field: keyof LinkItem, val: string) => {
    setLinks(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const addScreenshot = () => {
    if (newScreenshot.trim()) { setScreenshots(s => [...s, newScreenshot.trim()]); setNewScreenshot('') }
  }

  const handlePasteScreenshot = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const url = text.trim()
      if (url && (url.startsWith('http') || url.startsWith('/'))) {
        setScreenshots(s => [...s, url])
      } else {
        alert('ไม่พบ URL รูปภาพใน Clipboard')
      }
    } catch { alert('ไม่สามารถอ่าน Clipboard ได้ รบกวนอนุญาตการเข้าถึง Clipboard ในเบราว์เซอร์') }
  }

  const handlePasteCover = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const url = text.trim()
      if (url && (url.startsWith('http') || url.startsWith('/'))) {
        setCoverImage(url)
        setPendingCoverFile(null)
      } else {
        alert('ไม่พบ URL รูปภาพใน Clipboard')
      }
    } catch { alert('ไม่สามารถอ่าน Clipboard ได้') }
  }

  // Cover — stage locally only
  const handleUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setCoverImage(localUrl)
    setPendingCoverFile(file)
    e.target.value = ''
  }

  // Screenshots — stage locally, support multi-select
  const handleUploadScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newMap = new Map(pendingScreenshotFiles)
    const newUrls: string[] = []
    files.forEach(file => {
      const localUrl = URL.createObjectURL(file)
      newMap.set(localUrl, file)
      newUrls.push(localUrl)
    })
    setPendingScreenshotFiles(newMap)
    setScreenshots(s => [...s, ...newUrls])
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true); setSaveMsg(null)
    try {
      // Upload staged cover file first if any
      let finalCover = coverImage
      if (pendingCoverFile) {
        finalCover = await uploadImage(pendingCoverFile)
        URL.revokeObjectURL(coverImage)
      }

      // Upload staged screenshot files
      const finalScreenshots = await Promise.all(
        screenshots.map(async url => {
          const file = pendingScreenshotFiles.get(url)
          if (file) {
            const uploaded = await uploadImage(file)
            URL.revokeObjectURL(url)
            return uploaded
          }
          return url
        })
      )

      const { data: gameData, error: gameErr } = await supabase.from('games').insert({
        title: title.trim(),
        slug: slug || slugify(title),
        description,
        file_size: fileSize || null,
        video_url: videoUrl || null,
        cover_image: finalCover || null,
        screenshots: finalScreenshots,
        category_id: categoryIds[0] || null,
        category_ids: categoryIds.length > 0 ? categoryIds : null,
        is_featured: isFeatured,
        system_requirements: {
          platforms,
          minimum: { about: minAbout },
          recommended: { about: recAbout },
        },
      } as any).select().single()

      if (gameErr) throw gameErr

      const validLinks = links.filter(l => l.url.trim())
      if (validLinks.length > 0) {
        await supabase.from('download_links').insert(
          validLinks.map((l, i) => ({ game_id: (gameData as any).id, cloud_name: `[${l.platform || 'windows'}] ${l.cloud_name}`, url: l.url.trim(), sort_order: i })) as any
        )
      }

      setSaveMsg({ type: 'success', text: 'Game saved successfully!' })
      setTimeout(() => navigate('/ap-admin/games'), 1200)
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message || 'Failed to save game' })
    }
    setSaving(false)
  }

  return (
    <Page>
      <BackBtn onClick={() => navigate('/ap-admin/games')}><ArrowLeft size={14} /> Back to Games</BackBtn>
      <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plus size={22} style={{ color: '#7c3aed' }} /> Add New Game
      </h1>

      {saveMsg && (
        <Alert $type={saveMsg.type}>
          {saveMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {saveMsg.text}
        </Alert>
      )}

      <FormCard>
        {/* ── Gemini AI Auto-Fill ──────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <SectionTitle style={{ margin: 0 }}><Bot size={15} /> AI Auto-Fill</SectionTitle>
            <AiBadge><Sparkles size={10} /> Powered by Gemini</AiBadge>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginBottom: 12, lineHeight: 1.6 }}>
            พิมพ์ชื่อเกม แล้วกด <strong style={{ color: '#a855f7' }}>Generate</strong> — AI จะเติมข้อมูลทั้งหมดให้อัตโนมัติ (ชื่อ, คำอธิบาย, ประเภท, System Requirements)
          </p>
          <FetchRow>
            <AiSearchRow>
              <Input
                placeholder="GTA V..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                style={{ flex: 1 }}
              />
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '0 12px',
                  borderRadius: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                  minHeight: '40px'
                }}
              >
                <option value="gemini-flash-latest" style={{ background: '#0f172a', color: 'white' }}>Flash (Latest)</option>
                <option value="gemini-2.5-flash" style={{ background: '#0f172a', color: 'white' }}>2.5 Flash</option>
                <option value="gemini-2.0-flash" style={{ background: '#0f172a', color: 'white' }}>2.0 Flash</option>
                <option value="gemini-pro-latest" style={{ background: '#0f172a', color: 'white' }}>Pro (Latest)</option>
              </select>
              <AiGenerateBtn $loading={aiLoading} onClick={handleAiGenerate} disabled={aiLoading || !aiQuery.trim()} style={{ justifyContent: 'center' }}>
                {aiLoading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Wand2 size={16} />}
                {aiLoading ? 'Generating...' : 'Generate'}
              </AiGenerateBtn>
            </AiSearchRow>
          </FetchRow>

          {aiError && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ {aiError}
            </p>
          )}

          {aiPreview && (
            <AiResultCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={11} /> AI Result Preview
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleAiApply}
                    style={{ padding: '6px 16px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}
                  >
                    <CheckCircle size={13} /> Apply to Form
                  </button>
                  <button
                    onClick={() => setAiPreview(null)}
                    style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 13, cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              <AiResultRow><AiResultKey>🎮 Title</AiResultKey><AiResultVal>{aiPreview.title}</AiResultVal></AiResultRow>
              <AiResultRow><AiResultKey>🏷️ Genres</AiResultKey><AiResultVal>{(aiPreview.genres || []).join(', ')}</AiResultVal></AiResultRow>
              <AiResultRow><AiResultKey>💾 Size</AiResultKey><AiResultVal>{aiPreview.file_size}</AiResultVal></AiResultRow>
              <AiResultRow><AiResultKey>📝 Desc</AiResultKey><AiResultVal style={{ maxHeight: 80, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>{aiPreview.description}</AiResultVal></AiResultRow>
              <AiResultRow><AiResultKey>💻 Min Req</AiResultKey><AiResultVal style={{ whiteSpace: 'pre-line', fontSize: 12 }}>{aiPreview.minimum_requirements}</AiResultVal></AiResultRow>
            </AiResultCard>
          )}
        </div>

        {/* ── Basic Info ─────────────────────────────── */}
        <SectionTitle>📋 Basic Info</SectionTitle>
        <TwoColGrid>
          <Field><Label>Title *</Label><Input placeholder="e.g. Elden Ring" value={title} onChange={e => setTitle(e.target.value)} /></Field>
          <Field><Label>File Size (Storage)</Label><Input placeholder="e.g. 50 GB" value={fileSize} onChange={e => setFileSize(e.target.value)} /></Field>
        </TwoColGrid>
        <Field>
          <Label>Slug (URL)</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value)} />
        </Field>
        <Field>
          <Label>Category</Label>
          <MultiSelectCategory
            categories={categories}
            selectedIds={categoryIds}
            onChange={setCategoryIds}
            onAddCategory={async (name) => {
              try {
                const { data } = await supabase.from('categories').insert({ name, slug: slugify(name) } as any).select().single()
                if (data) {
                  setCategories(prev => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)))
                  setCategoryIds(prev => [...prev, (data as Category).id])
                }
              } catch (e) { console.error('Failed to add category', e) }
            }}
          />
        </Field>
        <Field><Label>Description</Label><TextArea placeholder="Game description..." value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <Field>
          <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
            Featured Game
          </Label>
        </Field>

        {/* ── Media (Cover, Screenshots & Video) ────── */}
        <SectionTitle><Image size={13} /> Media (Cover, Screenshots & Video)</SectionTitle>
        <Field><Label>Video Trailer (YouTube URL)</Label><Input placeholder="e.g. https://www.youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} /></Field>
        <Field>
          <Label>Cover Image URL (or Upload)</Label>
          <FetchRow>
            <Input placeholder="https://..." value={coverImage} onChange={e => { setCoverImage(e.target.value); setPendingCoverFile(null) }} style={{ flex: 1 }} />
            <FetchBtn onClick={handlePasteCover} style={{ padding: '10px 14px', background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)' }} title="วาง URL จาก Clipboard">
              📋 วาง
            </FetchBtn>
            <UploadBtn>
              <Image size={14} /> เลือกไฟล์
              {pendingCoverFile && <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>Staged</span>}
              <input type="file" accept="image/*" hidden onChange={handleUploadCover} />
            </UploadBtn>
          </FetchRow>
          {coverImage && <CoverPreview><CoverImg src={coverImage} alt="Cover" onError={e => (e.currentTarget.style.display = 'none')} /></CoverPreview>}
        </Field>
        <Field>
          <Label>Screenshots (URL or Upload)</Label>
          <FetchRow>
            <Input placeholder="Screenshot URL..." value={newScreenshot} onChange={e => setNewScreenshot(e.target.value)} onKeyDown={e => e.key === 'Enter' && addScreenshot()} style={{ flex: 1 }} />
            <FetchBtn onClick={handlePasteScreenshot} style={{ padding: '10px 14px', background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)', color: '#06b6d4' }} title="วาง URL จาก Clipboard">
              📋 วาง
            </FetchBtn>
            <FetchBtn onClick={addScreenshot} style={{ padding: '10px 14px' }}><Plus size={14} /> Add URL</FetchBtn>
            <UploadBtn>
              <Image size={14} /> เลือกไฟล์
              <input type="file" accept="image/*" hidden multiple onChange={handleUploadScreenshot} />
            </UploadBtn>
          </FetchRow>
          {screenshots.length > 0 && (
            <ScreenshotList>
              {screenshots.map((s, i) => (
                <ScreenshotThumb
                  key={i}
                  $dragging={dragIndex === i}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={e => { e.preventDefault() }}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === i) return
                    const next = [...screenshots]
                    const [moved] = next.splice(dragIndex, 1)
                    next.splice(i, 0, moved)
                    setScreenshots(next)
                    setDragIndex(null)
                  }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <img src={s} alt={`ss${i}`} style={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(124,58,237,0.2)' }} onError={e => (e.currentTarget.style.opacity = '0.3')} />
                  <RemoveBtn onClick={() => setScreenshots(ss => ss.filter((_, idx) => idx !== i))}><X size={9} /></RemoveBtn>
                </ScreenshotThumb>
              ))}
            </ScreenshotList>
          )}
        </Field>

        {/* ── System Requirements ────────────────────── */}
        <SectionTitle>💻 System Requirements</SectionTitle>
        <Field>
          <Label>Supported Platforms</Label>
          <div style={{ display: 'flex', gap: 16 }}>
            <Label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: '#e2e8f0' }}>
              <input type="checkbox" checked={platforms.includes('windows')} onChange={e => {
                if (e.target.checked) setPlatforms(p => [...p, 'windows'])
                else setPlatforms(p => p.filter(x => x !== 'windows'))
              }} />
              Windows
            </Label>
            <Label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: '#e2e8f0' }}>
              <input type="checkbox" checked={platforms.includes('macos')} onChange={e => {
                if (e.target.checked) setPlatforms(p => [...p, 'macos'])
                else setPlatforms(p => p.filter(x => x !== 'macos'))
              }} />
              macOS
            </Label>
          </div>
        </Field>
        <SpecGrid>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Minimum</p>
            <Field><Label>About Minimum</Label><TextArea placeholder="Minimum requirements..." value={minAbout} onChange={e => setMinAbout(e.target.value)} /></Field>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Recommended</p>
            <Field><Label>About Recommended</Label><TextArea placeholder="Recommended requirements..." value={recAbout} onChange={e => setRecAbout(e.target.value)} /></Field>
          </div>
        </SpecGrid>

        {/* ── Download Links ─────────────────────────── */}
        <SectionTitle>☁️ Download Links</SectionTitle>
        {links.map((link, i) => (
          <LinkRow key={i}>
            <CloudSelect value={link.platform || 'windows'} onChange={e => updateLink(i, 'platform', e.target.value)} style={{ width: 110 }}>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
            </CloudSelect>
            <CloudSelect value={link.cloud_name} onChange={e => updateLink(i, 'cloud_name', e.target.value)}>
              {CLOUD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </CloudSelect>
            <LinkInput placeholder="https://..." value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} />
            {links.length > 1 && (
              <IconBtn onClick={() => removeLink(i)}><Minus size={14} /></IconBtn>
            )}
          </LinkRow>
        ))}
        <AddLinkBtn onClick={addLink}><Plus size={14} /> Add Another Link</AddLinkBtn>

        <SaveBtn onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Game'}
        </SaveBtn>
      </FormCard>
    </Page>
  )
}
