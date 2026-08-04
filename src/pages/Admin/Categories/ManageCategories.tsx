import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Plus, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Category } from '../../../lib/supabase'

const Header = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;`
const Title = styled.h1`font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #fff;`

const Grid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @media(max-width:600px){grid-template-columns:1fr;}`

const Card = styled.div`background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15); border-radius: 16px; padding: 24px;`

const Label = styled.label`display: block; font-size: 13px; font-weight: 600; color: rgba(148,163,184,0.8); margin-bottom: 6px;`
const Input = styled.input`width: 100%; padding: 10px 14px; background: rgba(8,8,16,0.8); border: 1px solid rgba(124,58,237,0.2); border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; &:focus { border-color: rgba(124,58,237,0.5); } &::placeholder { color: rgba(148,163,184,0.4); }`

const AddBtn = styled.button`display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: linear-gradient(135deg, #7c3aed, #06b6d4); border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 12px; width: 100%; justify-content: center; &:hover { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; }`

const CatRow = styled.div`display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; border-bottom: 1px solid rgba(124,58,237,0.08); &:hover { background: rgba(124,58,237,0.05); } &:last-child { border-bottom: none; }`
const CatName = styled.span`font-size: 14px; font-weight: 500; color: #e2e8f0;`
const CatSlug = styled.span`font-size: 12px; color: rgba(148,163,184,0.4); margin-left: 8px;`
const DelBtn = styled.button`width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(239,68,68,0.2); background: transparent; color: #ef4444; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: rgba(239,68,68,0.1); }`

const Alert = styled.div<{ $type: 'success' | 'error' }>`display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; background: ${p => p.$type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${p => p.$type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}; color: ${p => p.$type === 'success' ? '#22c55e' : '#ef4444'};`

function slugify(str: string) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const { error } = await supabase.from('categories').insert({ name: newName.trim(), slug: slugify(newName) } as any)
    if (error) setMsg({ type: 'error', text: error.message })
    else { setMsg({ type: 'success', text: `"${newName}" added!` }); setNewName('') }
    setAdding(false); fetchCategories()
    setTimeout(() => setMsg(null), 3000)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  return (
    <div>
      <Header>
        <Title>🏷️ Categories</Title>
      </Header>
      <Grid>
        {/* Add Form */}
        <Card>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Add Category</h3>
          {msg && <Alert $type={msg.type}>{msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}</Alert>}
          <Label>Category Name</Label>
          <Input
            placeholder="e.g. Action, RPG, Horror..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          {newName && <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 6 }}>Slug: {slugify(newName)}</p>}
          <AddBtn onClick={handleAdd} disabled={adding || !newName.trim()}>
            {adding ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
            Add Category
          </AddBtn>
        </Card>

        {/* List */}
        <Card>
          <h3 style={{ fontFamily: 'Outfit', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>All Categories ({categories.length})</h3>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(148,163,184,0.4)', fontSize: 13 }}><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading...</div>
          ) : (
            categories.map(cat => (
              <CatRow key={cat.id}>
                <div>
                  <CatName>{cat.name}</CatName>
                  <CatSlug>/{cat.slug}</CatSlug>
                </div>
                <DelBtn onClick={() => handleDelete(cat.id)}><Trash2 size={12} /></DelBtn>
              </CatRow>
            ))
          )}
        </Card>
      </Grid>
    </div>
  )
}
