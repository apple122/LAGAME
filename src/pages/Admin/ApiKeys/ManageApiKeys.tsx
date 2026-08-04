import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Plus, Trash2, Loader2, Key, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { GeminiKey } from '../../../lib/gemini'

const Page = styled.div`
  max-width: 900px; margin: 0 auto;
`

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
`

const Title = styled.h1`
  font-size: 24px; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 10px;
  svg { color: #8b5cf6; }
`

const Card = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 20px; margin-bottom: 20px;
`

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th, td { text-align: left; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  th { color: rgba(148,163,184,0.8); font-size: 12px; font-weight: 600; text-transform: uppercase; }
  td { color: #f8fafc; font-size: 14px; }
`

const Badge = styled.span<{ $type: 'success' | 'warning' | 'danger' }>`
  padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 4px;
  background: ${p => p.$type === 'success' ? 'rgba(34,197,94,0.1)' : p.$type === 'warning' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)'};
  color: ${p => p.$type === 'success' ? '#4ade80' : p.$type === 'warning' ? '#fde047' : '#f87171'};
  border: 1px solid ${p => p.$type === 'success' ? 'rgba(34,197,94,0.2)' : p.$type === 'warning' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'};
`

const Button = styled.button<{ $primary?: boolean, $danger?: boolean }>`
  background: ${p => p.$primary ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : p.$danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)'};
  color: ${p => p.$danger ? '#ef4444' : '#fff'};
  border: ${p => p.$primary ? 'none' : p.$danger ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.1)'};
  padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 6px; font-size: 13px;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Input = styled.input`
  width: 100%; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none;
  &:focus { border-color: #7c3aed; }
`

const FormGroup = styled.div`
  margin-bottom: 16px;
  label { display: block; margin-bottom: 6px; color: rgba(148,163,184,0.9); font-size: 13px; }
`

const IconButton = styled.button<{ $danger?: boolean }>`
  background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px;
  color: ${p => p.$danger ? '#ef4444' : 'rgba(148,163,184,0.7)'};
  &:hover { background: rgba(255,255,255,0.05); color: ${p => p.$danger ? '#f87171' : '#fff'}; }
`

export default function ManageApiKeys() {
  const [keys, setKeys] = useState<GeminiKey[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formKey, setFormKey] = useState('')
  const [formModel, setFormModel] = useState('gemini-flash-latest')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('gemini_api_keys').select('*').order('created_at', { ascending: true })
    if (!error && data) {
      setKeys(data as GeminiKey[])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formKey.trim()) return
    setSaving(true)
    const { error } = await (supabase as any).from('gemini_api_keys').insert({
      name: formName,
      api_key: formKey,
      model: formModel
    })
    
    setSaving(false)
    if (!error) {
      setShowForm(false)
      setFormName('')
      setFormKey('')
      fetchKeys()
    } else {
      alert('Error saving key: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API Key?')) return
    await (supabase as any).from('gemini_api_keys').delete().eq('id', id)
    fetchKeys()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from('gemini_api_keys').update({ is_active: !current }).eq('id', id)
    fetchKeys()
  }

  const handleClearCooldown = async (id: string) => {
    await (supabase as any).from('gemini_api_keys').update({ cooldown_until: null }).eq('id', id)
    fetchKeys()
  }

  const formatCooldown = (dateStr: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (d.getTime() < Date.now()) return null
    return d.toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Page>
      <Header>
        <Title><Key size={24} /> API Keys Manager</Title>
        <Button $primary onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Add New Key
        </Button>
      </Header>

      <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 14, marginBottom: 20 }}>
        The system will automatically try to use active keys from this list. If a key hits the quota limit (429), it will be placed on cooldown and the system will fallback to the next available key.
      </p>

      {showForm && (
        <Card style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.2)' }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, color: '#fff' }}>Add New API Key</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 16 }}>
            <FormGroup>
              <label>Name / Identifier</label>
              <Input placeholder="e.g. Account A" value={formName} onChange={e => setFormName(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <label>API Key</label>
              <Input placeholder="AIza..." value={formKey} onChange={e => setFormKey(e.target.value)} type="password" />
            </FormGroup>
            <FormGroup>
              <label>Default Model</label>
              <select 
                value={formModel}
                onChange={e => setFormModel(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: 14, outline: 'none'
                }}
              >
                <option value="gemini-flash-latest">gemini-flash-latest</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                <option value="gemini-pro-latest">gemini-pro-latest</option>
              </select>
            </FormGroup>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <Button onClick={() => setShowForm(false)}>Cancel</Button>
            <Button $primary onClick={handleSave} disabled={saving || !formName || !formKey}>
              {saving ? <Loader2 size={16} className="spin" /> : 'Save Key'}
            </Button>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading keys...</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No API keys found. Add one above.</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>API Key</th>
                <th>Status</th>
                <th>Cooldown</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(key => {
                const cooldown = formatCooldown(key.cooldown_until)
                return (
                  <tr key={key.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{key.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{key.model}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', opacity: 0.7 }}>
                      {key.api_key.substring(0, 8)}...{key.api_key.substring(key.api_key.length - 4)}
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={key.is_active} onChange={() => handleToggleActive(key.id, key.is_active)} />
                        {key.is_active ? 'Active' : 'Inactive'}
                      </label>
                    </td>
                    <td>
                      {cooldown ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Badge $type="danger"><Clock size={12} /> Until {cooldown}</Badge>
                          <Button style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleClearCooldown(key.id)}>Clear</Button>
                        </div>
                      ) : (
                        <Badge $type="success"><CheckCircle size={12} /> Ready</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <IconButton $danger onClick={() => handleDelete(key.id)} title="Delete">
                        <Trash2 size={16} />
                      </IconButton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  )
}
