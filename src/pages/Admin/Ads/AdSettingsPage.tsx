import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Save, Loader2, CheckCircle, AlertCircle, Megaphone, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAdSettings } from '../../../context/AdSettingsContext'
import {
  AdminPage, PageHeader, PageTitle, PageSubTitle,
  Card, CardHeader, CardTitle,
  TwoCol, Field, Label, Input, Hint,
  PrimaryBtn,
  Alert, Divider,
  ToggleRow, ToggleLabel, ToggleHint, TogglePill
} from '../adminStyles'

const StepItem = styled.div`
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  &:last-child { border-bottom: none; }
`
const StepNum = styled.div`
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2));
  border: 1px solid rgba(124,58,237,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #a78bfa;
`

const RangeWrap = styled.div`
  input[type="range"] {
    -webkit-appearance: none; width: 100%; height: 6px;
    background: rgba(255,255,255,0.08); border-radius: 3px; outline: none;
    accent-color: #7c3aed; cursor: pointer;
    &::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      cursor: pointer; box-shadow: 0 2px 6px rgba(124,58,237,0.5);
    }
  }
`

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
    else { setMsg({ type: 'success', text: 'Ad settings saved successfully!' }); refresh() }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <AdminPage $maxWidth="800px">
      <PageHeader>
        <div>
          <PageTitle>
            <Megaphone size={26} style={{ color: '#f59e0b' }} />
            Ad Settings
          </PageTitle>
          <PageSubTitle>Configure interstitial ads shown before download links.</PageSubTitle>
        </div>
        <PrimaryBtn onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</>
            : <><Save size={15} /> Save Settings</>
          }
        </PrimaryBtn>
      </PageHeader>

      {msg && (
        <Alert $type={msg.type}>
          {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </Alert>
      )}

      <TwoCol>
        {/* Config Card */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardHeader>
            <CardTitle><Megaphone size={16} style={{ color: '#f59e0b' }} /> Ad Configuration</CardTitle>
          </CardHeader>

          <ToggleRow>
            <div>
              <ToggleLabel>Ad Status</ToggleLabel>
              <ToggleHint>
                {isActive ? '✅ Enabled — Users see the ad before downloading' : '❌ Disabled — Users go directly to download'}
              </ToggleHint>
            </div>
            <TogglePill $on={isActive} onClick={() => setIsActive(v => !v)} />
          </ToggleRow>

          <Divider />

          <Field>
            <Label>Ad URL (iframe source)</Label>
            <Input
              placeholder="https://your-ad-network.com/ad-unit-id"
              value={adUrl}
              onChange={e => setAdUrl(e.target.value)}
            />
            <Hint>Enter the iframe source URL from PopAds, PropellerAds, AdSense, etc.</Hint>
          </Field>

          <Field>
            <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} style={{ color: '#7c3aed' }} />
              Countdown Duration
              <span style={{ marginLeft: 'auto', fontFamily: 'Noto Sans Lao', fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>
                {countdown}s
              </span>
            </Label>
            <RangeWrap>
              <input
                type="range" min={3} max={30} value={countdown}
                onChange={e => setCountdown(Number(e.target.value))}
              />
            </RangeWrap>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <Hint>3s (fast)</Hint>
              <Hint>30s (long)</Hint>
            </div>
          </Field>
        </Card>

        {/* How it works */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardHeader>
            <CardTitle>ℹ️ How the Download Flow Works</CardTitle>
          </CardHeader>
          {[
            ['1', 'User clicks a Cloud download button on a game page'],
            ['2', 'System checks if ads are enabled (Ad Status toggle above)'],
            ['3', `If ENABLED: User sees an interstitial ad with ${countdown}s countdown`],
            ['4', '"Proceed to Download" button appears after countdown ends'],
            ['5', 'User clicks Proceed → download link opens in new tab'],
            ['6', 'If DISABLED: Download link opens directly without any ad'],
          ].map(([num, text]) => (
            <StepItem key={num}>
              <StepNum>{num}</StepNum>
              <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, margin: 0 }}>{text}</p>
            </StepItem>
          ))}
        </Card>
      </TwoCol>
    </AdminPage>
  )
}
