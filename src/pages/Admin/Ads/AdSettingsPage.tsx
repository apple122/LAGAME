import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Save, Loader2, CheckCircle, AlertCircle, Megaphone, Eye, EyeOff, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAdSettings } from '../../../context/AdSettingsContext'

const Page = styled.div`max-width: 700px;`
const Card = styled.div`background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15); border-radius: 16px; padding: 28px; margin-bottom: 20px;`
const SectionTitle = styled.h3`font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(148,163,184,0.5); margin-bottom: 20px; display: flex; align-items: center; gap: 6px;`
const Field = styled.div`margin-bottom: 20px;`
const Label = styled.label`display: block; font-size: 13px; font-weight: 600; color: rgba(148,163,184,0.8); margin-bottom: 6px;`
const Input = styled.input`width: 100%; padding: 10px 14px; background: rgba(8,8,16,0.8); border: 1px solid rgba(124,58,237,0.2); border-radius: 8px; color: #e2e8f0; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; &:focus { border-color: rgba(124,58,237,0.5); } &::placeholder { color: rgba(148,163,184,0.4); }`

const Toggle = styled.button<{ $on: boolean }>`
  display: flex; align-items: center; gap: 10px; padding: 12px 20px;
  background: ${p => p.$on ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
  border: 1px solid ${p => p.$on ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
  border-radius: 10px; cursor: pointer; transition: all 0.2s;
  color: ${p => p.$on ? '#22c55e' : '#ef4444'}; font-size: 14px; font-weight: 600;
  &:hover { opacity: 0.85; }
`

const Pill = styled.div<{ $on: boolean }>`
  width: 36px; height: 20px; border-radius: 10px;
  background: ${p => p.$on ? '#22c55e' : '#ef4444'};
  position: relative; transition: background 0.2s;
  &::after { content: ''; position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; top: 3px; left: ${p => p.$on ? '19px' : '3px'}; transition: left 0.2s; }
`

const SaveBtn = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #7c3aed, #06b6d4); border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif; transition: opacity 0.2s; &:hover:not(:disabled) { opacity: 0.9; } &:disabled { opacity: 0.5; cursor: not-allowed; }`
const Alert = styled.div<{ $type: 'success' | 'error' }>`display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; background: ${p => p.$type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${p => p.$type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}; color: ${p => p.$type === 'success' ? '#22c55e' : '#ef4444'};`



export default function AdSettingsPage() {
  const { adSettings, refresh } = useAdSettings()
  const [adUrl, setAdUrl] = useState('')
  const [countdown, setCountdown] = useState(10)
  const [isActive, setIsActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (adSettings) {
      setAdUrl(adSettings.ad_url || '')
      setCountdown(adSettings.countdown_seconds || 10)
      setIsActive(adSettings.is_active)
    }
  }, [adSettings])

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    const id = adSettings?.id
    const payload = { ad_url: adUrl, countdown_seconds: countdown, is_active: isActive, updated_at: new Date().toISOString() }
    let error
    if (id) {
      const res = await (supabase.from('ad_settings') as any).update(payload).eq('id', id)
      error = res.error
    } else {
      const res = await (supabase.from('ad_settings') as any).insert(payload)
      error = res.error
    }
    if (error) setMsg({ type: 'error', text: error.message })
    else { setMsg({ type: 'success', text: 'Ad settings saved!' }); refresh() }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <Page>
      <h1 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Megaphone size={22} style={{ color: '#7c3aed' }} /> Ad Settings
      </h1>

      {msg && <Alert $type={msg.type}>{msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}</Alert>}

      <Card>
        <SectionTitle><Megaphone size={12} /> Interstitial Ad Configuration</SectionTitle>

        <Field>
          <Label>Ad Status</Label>
          <Toggle $on={isActive} onClick={() => setIsActive(v => !v)}>
            <Pill $on={isActive} />
            {isActive ? <><Eye size={15} /> Ads Enabled — Users see ad before download</> : <><EyeOff size={15} /> Ads Disabled — Users go directly to download</>}
          </Toggle>
        </Field>

        <Field>
          <Label>Ad URL (iframe source)</Label>
          <Input
            placeholder="https://your-ad-network.com/ad-unit-id"
            value={adUrl}
            onChange={e => setAdUrl(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 6 }}>
            Enter the URL of your ad iframe (e.g. PopAds, PropellerAds, AdSense interstitial, etc.)
          </p>
        </Field>

        <Field>
          <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} /> Countdown (seconds): <strong style={{ color: '#7c3aed' }}>{countdown}s</strong>
          </Label>
          <input
            type="range" min={3} max={30} value={countdown}
            onChange={e => setCountdown(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 4 }}>
            <span>3s (fast)</span><span>30s (long)</span>
          </div>
        </Field>

        <SaveBtn onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
          Save Settings
        </SaveBtn>
      </Card>

      {/* How it works */}
      <Card>
        <SectionTitle>ℹ️ How the Download Flow Works</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['1', 'User clicks a Cloud download button on a game page'],
            ['2', 'System checks if ads are enabled (Ad Status above)'],
            ['3', 'If ENABLED: User is redirected to the interstitial ad page'],
            ['4', `Ad iframe loads + countdown starts (${countdown}s)`],
            ['5', '"Proceed to Download" button appears after countdown ends'],
            ['6', 'User clicks Proceed → download link opens in new tab'],
            ['7', 'If DISABLED: Download link opens directly — no ad shown'],
          ].map(([num, text]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#9d5cf5', flexShrink: 0 }}>{num}</div>
              <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}
