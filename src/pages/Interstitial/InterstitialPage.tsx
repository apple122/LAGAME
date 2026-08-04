import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Shield, ExternalLink, Clock, CheckCircle } from 'lucide-react'
import { useAdSettings } from '../../context/AdSettingsContext'

const Page = styled.div`
  min-height: 100vh; background: #080810;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px; position: relative; overflow: hidden;
`

const Bg = styled.div`
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(124,58,237,0.05) 1px, transparent 1px);
  background-size: 32px 32px;
`

const Card = styled.div`
  position: relative; z-index: 1;
  background: rgba(14,14,26,0.95); backdrop-filter: blur(20px);
  border: 1px solid rgba(124,58,237,0.25); border-radius: 24px;
  padding: 40px; max-width: 560px; width: 100%; text-align: center;
  box-shadow: 0 0 60px rgba(124,58,237,0.15);
  animation: fadeIn 0.4s ease;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`

const AdFrame = styled.iframe`
  width: 100%; height: 250px; border: none; border-radius: 12px;
  background: rgba(18,18,31,0.8); border: 1px solid rgba(124,58,237,0.15);
  margin: 24px 0;
`

const AdPlaceholder = styled.div`
  width: 100%; height: 250px; border-radius: 12px;
  background: rgba(18,18,31,0.8); border: 1px dashed rgba(124,58,237,0.25);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; margin: 24px 0; color: rgba(148,163,184,0.4); font-size: 13px;
`

const CountdownRing = styled.div`
  width: 80px; height: 80px; margin: 0 auto 16px;
  position: relative; display: flex; align-items: center; justify-content: center;
`

const CountdownNum = styled.div`
  font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #fff;
  position: absolute;
`

const ProceedBtn = styled.button`
  display: flex; align-items: center; gap: 10px; justify-content: center;
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  border: none; border-radius: 12px; color: #fff;
  font-size: 16px; font-weight: 700; cursor: pointer;
  font-family: 'Outfit', sans-serif;
  transition: opacity 0.2s, transform 0.2s;
  animation: popIn 0.3s ease;
  @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  &:hover { opacity: 0.9; transform: scale(1.02); }
`

const SkipNote = styled.p`font-size: 12px; color: rgba(148,163,184,0.4); margin-top: 14px;`

export default function InterstitialPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { adSettings, loading } = useAdSettings()
  const targetUrl = params.get('url') ? decodeURIComponent(params.get('url')!) : null
  const cloudName = params.get('cloud') ? decodeURIComponent(params.get('cloud')!) : 'Cloud'
  const [countdown, setCountdown] = useState(10)
  const [ready, setReady] = useState(false)

  const totalSeconds = adSettings?.countdown_seconds || 10

  useEffect(() => {
    if (!targetUrl) { navigate('/'); return }
    if (loading) return

    setCountdown(totalSeconds)
    setReady(false)

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setReady(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [targetUrl, loading, totalSeconds])

  const proceed = () => {
    if (!ready || !targetUrl) return
    window.open(targetUrl, '_blank', 'noopener')
    setTimeout(() => navigate(-1), 300)
  }

  const pct = ((totalSeconds - countdown) / totalSeconds) * 100
  const circumference = 2 * Math.PI * 34
  const dash = circumference - (pct / 100) * circumference

  if (!targetUrl) return null

  return (
    <Page>
      <Bg />
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <Shield size={16} style={{ color: '#7c3aed' }} />
          <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>Preparing your download</span>
        </div>

        <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          Downloading from {cloudName}
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', marginBottom: 20 }}>
          Please wait while we prepare your download link
        </p>

        {/* Ad Area */}
        {adSettings?.ad_url ? (
          <AdFrame src={adSettings.ad_url} sandbox="allow-scripts allow-same-origin" title="Advertisement" />
        ) : (
          <AdPlaceholder>
            <div style={{ fontSize: 32 }}>📢</div>
            <span>Advertisement</span>
          </AdPlaceholder>
        )}

        {/* Countdown */}
        {!ready ? (
          <>
            <CountdownRing>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="5" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#7c3aed" strokeWidth="5"
                  strokeDasharray={circumference} strokeDashoffset={dash}
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <CountdownNum>{countdown}</CountdownNum>
            </CountdownRing>
            <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>
              <Clock size={13} style={{ verticalAlign: 'middle' }} /> Download link available in {countdown}s
            </p>
          </>
        ) : (
          <ProceedBtn onClick={proceed}>
            <CheckCircle size={20} />
            Proceed to Download
            <ExternalLink size={16} />
          </ProceedBtn>
        )}

        <SkipNote>Ad revenue helps us keep this site free ♥</SkipNote>
      </Card>
    </Page>
  )
}
