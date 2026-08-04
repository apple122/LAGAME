import { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { MessageSquare, Star, Send, Loader2, Trash2, Clock, Image as ImageIcon, X, CornerDownRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`

const Section = styled.div`margin-top: 40px;`

const SectionTitle = styled.h2`
  font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; color: #fff;
  display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
  padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
`

const FormCard = styled.div`
  background: rgba(12,12,22,0.6); backdrop-filter: blur(12px);
  border: 1px solid rgba(124,58,237,0.15); border-radius: 16px;
  padding: 24px; margin-bottom: 28px;
`

const InputRow = styled.div`position: relative; margin-bottom: 14px;`

const Input = styled.input`
  width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 10px 14px; color: #e2e8f0; font-size: 14px;
  transition: border-color 0.2s; outline: none; box-sizing: border-box;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(148,163,184,0.4); }
`

const NameDropdown = styled.div`
  position: absolute; top: calc(100% + 4px); left: 0; width: 100%;
  background: rgba(18,18,31,0.95); backdrop-filter: blur(12px);
  border: 1px solid rgba(124,58,237,0.2); border-radius: 10px;
  overflow: hidden; z-index: 10; max-height: 150px; overflow-y: auto;
`

const NameOption = styled.div`
  padding: 10px 14px; font-size: 14px; color: rgba(255,255,255,0.8);
  cursor: pointer; transition: background 0.15s;
  &:hover { background: rgba(124,58,237,0.15); color: #fff; }
`

const Textarea = styled.textarea`
  width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 10px 14px; color: #e2e8f0; font-size: 14px;
  resize: vertical; min-height: 90px; box-sizing: border-box;
  transition: border-color 0.2s; outline: none; font-family: inherit;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(148,163,184,0.4); }
`

const StarRow = styled.div`display: flex; gap: 4px; margin-bottom: 14px;`
const StarBtn = styled.button<{ $active: boolean }>`
  background: none; border: none; cursor: pointer; padding: 2px;
  font-size: 24px; transition: transform 0.15s;
  filter: ${p => p.$active ? 'none' : 'grayscale(1) opacity(0.35)'};
  &:hover { transform: scale(1.2); filter: none; }
`

const ActionRow = styled.div`display: flex; justify-content: space-between; align-items: center; margin-top: 14px;`
const BtnGroup = styled.div`display: flex; gap: 10px; align-items: center;`

const ImageBtn = styled.label`
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(148,163,184,0.8); font-size: 13px; cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.1); color: #fff; }
`

const SubmitBtn = styled.button`
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: #fff; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: all 0.2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
`

const Lightbox = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
`
const LightboxImg = styled.img`
  max-width: 90vw; max-height: 90vh; border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
`
const LightboxClose = styled.button`
  position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 8px;
  padding: 8px 14px; cursor: pointer; font-size: 14px; transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.2); }
`

const ImagePreviewWrap = styled.div`
  position: relative; display: inline-block; margin-top: 10px;
`
const ImagePreview = styled.img`
  max-width: 200px; max-height: 150px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
`
const RemoveImageBtn = styled.button`
  position: absolute; top: -8px; right: -8px; width: 24px; height: 24px;
  border-radius: 50%; background: #ef4444; border: none; color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
`

const CommentList = styled.div`display: flex; flex-direction: column; gap: 14px;`

const CommentCard = styled.div<{ $isReply?: boolean }>`
  background: ${p => p.$isReply ? 'transparent' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${p => p.$isReply ? 'transparent' : 'rgba(255,255,255,0.04)'};
  border-radius: 12px; padding: ${p => p.$isReply ? '8px 0 8px 16px' : '16px 20px'};
  margin-left: ${p => p.$isReply ? '44px' : '0'};
  border-left: ${p => p.$isReply ? '2px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.04)'};
  animation: ${fadeIn} 0.3s ease; position: relative;
  @media (max-width: 600px) { margin-left: ${p => p.$isReply ? '24px' : '0'}; }
`

const CommentHeader = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 8px;`
const Avatar = styled.div`
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: #fff;
`
const AuthorName = styled.div`font-weight: 600; font-size: 14px; color: #e2e8f0;`
const CommentDate = styled.div`font-size: 12px; color: rgba(148,163,184,0.5); display: flex; align-items: center; gap: 4px;`
const RatingDisplay = styled.div`font-size: 14px; margin-left: auto;`
const CommentText = styled.p`font-size: 14px; color: rgba(203,213,225,0.85); line-height: 1.6; margin: 0 0 10px 0; white-space: pre-wrap;`
const CommentImage = styled.img`
  max-width: 250px; max-height: 200px; width: auto; height: auto; object-fit: contain;
  border-radius: 8px; margin-bottom: 10px; cursor: zoom-in;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2);
  transition: transform 0.2s;
  &:hover { transform: scale(1.02); border-color: rgba(124,58,237,0.4); }
  @media (max-width: 600px) { max-width: 100%; }
`

const ReplyBtn = styled.button`
  background: none; border: none; color: rgba(148,163,184,0.7); font-size: 12px;
  cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 0;
  transition: color 0.15s;
  &:hover { color: #fff; }
`

const EmptyState = styled.div`text-align: center; padding: 40px; color: rgba(148,163,184,0.4); background: rgba(255,255,255,0.02); border-radius: 12px; font-size: 14px;`
const SuccessMsg = styled.div`background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; border-radius: 10px; padding: 10px 16px; font-size: 13px; margin-bottom: 14px;`
const ErrorMsg = styled.div`background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; border-radius: 10px; padding: 10px 16px; font-size: 13px; margin-bottom: 14px;`

interface Comment {
  id: string
  parent_id: string | null
  author_name: string
  content: string
  rating: number | null
  image_url: string | null
  created_at: string
}

interface Props {
  type: 'game' | 'website'
  gameId?: string
  isAdmin?: boolean
}

export default function CommentSection({ type, gameId, isAdmin = false }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // LocalStorage Names
  const [savedNames, setSavedNames] = useState<string[]>([])
  const [showNameDropdown, setShowNameDropdown] = useState(false)
  const nameInputRef = useRef<HTMLDivElement>(null)

  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  
  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    // Load names from localStorage
    try {
      const names = JSON.parse(localStorage.getItem('lapack_comment_names') || '[]')
      if (Array.isArray(names)) {
        setSavedNames(names)
        if (names.length > 0) setName(names[0])
      }
    } catch (e) { }

    const handleClickOutside = (e: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.contains(e.target as Node)) {
        setShowNameDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveName = (newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const updated = [trimmed, ...savedNames.filter(n => n !== trimmed)].slice(0, 5) // keep last 5
    setSavedNames(updated)
    localStorage.setItem('lapack_comment_names', JSON.stringify(updated))
  }

  const loadComments = async () => {
    let query = (supabase as any).from('comments').select('*')
      .eq('type', type)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (type === 'game' && gameId) {
      query = query.eq('game_id', gameId)
    }

    const { data } = await query
    setComments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadComments() }, [type, gameId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('ขนาดรูปภาพต้องไม่เกิน 2MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('ไฟล์ต้องเป็นรูปภาพเท่านั้น')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
    const { error: uploadError } = await supabase.storage.from('comment-images').upload(fileName, file)
    if (uploadError) throw new Error('อัปโหลดรูปล้มเหลว: ' + uploadError.message)
    const { data: { publicUrl } } = supabase.storage.from('comment-images').getPublicUrl(fileName)
    return publicUrl
  }

  const handleSubmit = async (parentId: string | null = null) => {
    if (!name.trim()) { setError('กรุณาใส่ชื่อของคุณ'); return }
    if (!content.trim()) { setError('กรุณาเขียน Comment'); return }
    if (content.trim().length < 5) { setError('Comment สั้นเกินไป (ขั้นต่ำ 5 ตัวอักษร)'); return }
    if (type === 'game' && rating === 0 && !parentId) { setError('กรุณาให้คะแนนเกมก่อน'); return }

    setSubmitting(true)
    setError('')
    try {
      let uploadedImageUrl = null
      if (imageFile) {
        uploadedImageUrl = await uploadImage(imageFile)
      }

      const payload: any = {
        type,
        author_name: name.trim(),
        content: content.trim(),
        is_approved: true,
        parent_id: parentId,
        image_url: uploadedImageUrl
      }
      if (type === 'game') {
        payload.game_id = gameId
        payload.rating = parentId ? null : rating // replies don't have ratings
      }

      const { error: err } = await (supabase as any).from('comments').insert(payload)
      if (err) throw err

      saveName(name)
      setContent('')
      setRating(0)
      removeImage()
      setReplyingTo(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      await loadComments()
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้งครับ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบ Comment นี้?')) return
    await (supabase as any).from('comments').delete().eq('id', id)
    // Deletion might cascade to replies on DB level, so reload is safer
    await loadComments()
  }

  const topLevelComments = comments.filter(c => !c.parent_id)
  const replies = comments.filter(c => c.parent_id)

  const avgRating = topLevelComments.filter(c => c.rating).length > 0
    ? (topLevelComments.reduce((s, c) => s + (c.rating || 0), 0) / topLevelComments.filter(c => c.rating).length).toFixed(1)
    : null

  const renderCommentForm = (parentId: string | null = null) => (
    <FormCard style={parentId ? { padding: 16, margin: '10px 0 0 0', background: 'rgba(0,0,0,0.2)' } : undefined}>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 14 }}>
        {parentId ? 'ตอบกลับ Comment' : type === 'game' ? '✍️ เขียนรีวิวของคุณ' : '✍️ ฝากข้อความ'}
      </div>
      
      {!parentId && success && <SuccessMsg>✅ ขอบคุณ! Comment ถูกบันทึกแล้วครับ</SuccessMsg>}
      {error && <ErrorMsg>⚠️ {error}</ErrorMsg>}

      <InputRow ref={nameInputRef}>
        <Input
          placeholder="ชื่อของคุณ *"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setShowNameDropdown(true)}
          maxLength={50}
        />
        {showNameDropdown && savedNames.length > 0 && (
          <NameDropdown>
            {savedNames.map((n, i) => (
              <NameOption key={i} onClick={() => { setName(n); setShowNameDropdown(false) }}>{n}</NameOption>
            ))}
          </NameDropdown>
        )}
      </InputRow>

      {type === 'game' && !parentId && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', marginBottom: 6 }}>ให้คะแนน *</div>
          <StarRow>
            {[1, 2, 3, 4, 5].map(s => (
              <StarBtn
                key={s}
                $active={s <= (hoverRating || rating)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
                type="button"
              >⭐</StarBtn>
            ))}
            {rating > 0 && (
              <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginLeft: 6, alignSelf: 'center' }}>
                {['', 'แย่มาก', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม!'][rating]}
              </span>
            )}
          </StarRow>
        </div>
      )}

      <Textarea
        placeholder="เขียนข้อความ..."
        value={content}
        onChange={e => setContent(e.target.value)}
        maxLength={1000}
        style={{ minHeight: parentId ? 60 : 90 }}
      />

      {imagePreview && (
        <ImagePreviewWrap>
          <ImagePreview src={imagePreview} alt="Preview" />
          <RemoveImageBtn onClick={removeImage}><X size={14} /></RemoveImageBtn>
        </ImagePreviewWrap>
      )}

      <ActionRow>
        <BtnGroup>
          <ImageBtn>
            <ImageIcon size={15} />
            <span>แนบรูป</span>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </ImageBtn>
          {parentId && (
            <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer', padding: '8px 12px' }}>
              ยกเลิก
            </button>
          )}
        </BtnGroup>
        
        <SubmitBtn onClick={() => handleSubmit(parentId)} disabled={submitting}>
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          {submitting ? 'กำลังส่ง...' : 'ส่ง'}
        </SubmitBtn>
      </ActionRow>
    </FormCard>
  )

  const renderCommentCard = (c: Comment, isReply = false) => {
    const commentReplies = replies.filter(r => r.parent_id === c.id).reverse()
    return (
      <div key={c.id}>
        <CommentCard $isReply={isReply}>
          <CommentHeader>
            <Avatar>{c.author_name.charAt(0).toUpperCase()}</Avatar>
            <div style={{ flex: 1 }}>
              <AuthorName>{c.author_name}</AuthorName>
              <CommentDate>
                <Clock size={11} />
                {new Date(c.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </CommentDate>
            </div>
            {c.rating && !isReply && (
              <RatingDisplay>
                {'⭐'.repeat(c.rating)}
              </RatingDisplay>
            )}
            {isAdmin && (
              <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}>
                <Trash2 size={15} />
              </button>
            )}
          </CommentHeader>
          
          <CommentText>{c.content}</CommentText>
          
          {c.image_url && (
            <CommentImage src={c.image_url} alt="Attached image" onClick={() => setLightboxImage(c.image_url!)} />
          )}

          {!isReply && (
            <ReplyBtn onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}>
              <CornerDownRight size={14} /> ตอบกลับ
            </ReplyBtn>
          )}

          {replyingTo === c.id && renderCommentForm(c.id)}
        </CommentCard>

        {/* Render Replies */}
        {commentReplies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {commentReplies.map(reply => renderCommentCard(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Section>
      <SectionTitle>
        <MessageSquare size={22} color="#7c3aed" />
        {type === 'game' ? 'รีวิวและ Comment' : '💬 Guestbook — ฝากข้อความถึงเรา'}
        {avgRating && (
          <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={16} fill="#fbbf24" /> {avgRating} ({topLevelComments.filter(c => c.rating).length} รีวิว)
          </span>
        )}
      </SectionTitle>

      {!replyingTo && renderCommentForm()}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'rgba(148,163,184,0.4)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : topLevelComments.length === 0 ? (
        <EmptyState>
          {type === 'game' ? '🎮 ยังไม่มีรีวิว เป็นคนแรกที่รีวิวเกมนี้ได้เลย!' : '💬 ยังไม่มีข้อความ เป็นคนแรกที่ฝากข้อความได้เลยครับ!'}
        </EmptyState>
      ) : (
        <CommentList>
          {topLevelComments.map(c => renderCommentCard(c))}
        </CommentList>
      )}

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <Lightbox onClick={() => setLightboxImage(null)}>
          <LightboxClose onClick={() => setLightboxImage(null)}>✕ ปิด</LightboxClose>
          <LightboxImg src={lightboxImage} alt="Fullscreen Preview" onClick={e => e.stopPropagation()} />
        </Lightbox>
      )}
    </Section>
  )
}
