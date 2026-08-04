import { supabase } from './supabase'

// ── Platform Detection ────────────────────────────────────────────
export type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other'

export function detectPlatform(): Platform {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ''
  const uaLower = ua.toLowerCase()

  // iOS — must check before macOS because iPad reports macOS in some UA
  if (/ipad|iphone|ipod/.test(uaLower) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }

  // Android
  if (/android/.test(uaLower)) {
    return 'android'
  }

  // macOS
  if (/macintosh|mac os x/.test(uaLower) && !/iphone|ipad/.test(uaLower)) {
    return 'macos'
  }

  // Windows
  if (/windows nt|win32|win64/.test(uaLower)) {
    return 'windows'
  }

  // Linux
  if (/linux/.test(uaLower)) {
    return 'linux'
  }

  return 'other'
}

// ── Site Visit Tracking ───────────────────────────────────────────
const SITE_VISIT_KEY = 'lap_site_visited'

/**
 * Track a site-wide page visit (once per browser session).
 * Stores in `site_views` table.
 */
export async function trackSiteVisit(): Promise<void> {
  try {
    // Prevent double-tracking in same browser session
    if (sessionStorage.getItem(SITE_VISIT_KEY)) return
    sessionStorage.setItem(SITE_VISIT_KEY, '1')

    const platform = detectPlatform()
    // Cast as any: Supabase client doesn't have types for analytics tables
    await (supabase as any).from('site_views').insert({ platform })
  } catch (err) {
    // Analytics should never break the app
    console.warn('Analytics: trackSiteVisit failed', err)
  }
}

// ── Game View Tracking ────────────────────────────────────────────
/**
 * Track a game page view by platform.
 * Uses upsert to increment platform-specific counter in `game_view_platforms`.
 * Also increments the legacy `view_count` on the games table.
 */
export async function trackGameView(gameId: string, currentViewCount: number): Promise<void> {
  try {
    const platform = detectPlatform()

    // Upsert into game_view_platforms (increment counter per platform)
    await (supabase as any).rpc('increment_game_platform_view', {
      p_game_id: gameId,
      p_platform: platform,
    })

    // Also update legacy view_count on games table
    await (supabase as any)
      .from('games')
      .update({ view_count: currentViewCount + 1 })
      .eq('id', gameId)
  } catch (err) {
    console.warn('Analytics: trackGameView failed', err)
  }
}

// ── Analytics Queries ────────────────────────────────────────────
export interface PlatformStat {
  platform: Platform | string
  count: number
}

/** Get site-wide visits grouped by platform */
export async function getSitePlatformStats(): Promise<PlatformStat[]> {
  const { data, error } = await (supabase as any)
    .from('site_views')
    .select('platform')

  if (error || !data) return []

  const map: Record<string, number> = {}
  for (const row of (data as any[])) {
    map[row.platform] = (map[row.platform] || 0) + 1
  }

  return Object.entries(map)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
}

/** Get total site visits */
export async function getTotalSiteVisits(): Promise<number> {
  const { count } = await (supabase as any)
    .from('site_views')
    .select('id', { count: 'exact', head: true })
  return count || 0
}

/** Get platform breakdown for a specific game */
export async function getGamePlatformStats(gameId: string): Promise<PlatformStat[]> {
  const { data, error } = await (supabase as any)
    .from('game_view_platforms')
    .select('platform, view_count')
    .eq('game_id', gameId)

  if (error || !data) return []
  return (data as any[]).map(r => ({ platform: r.platform, count: r.view_count }))
    .sort((a, b) => b.count - a.count)
}

/** Get all games with their platform breakdown (for top games chart) */
export async function getAllGamesPlatformStats(): Promise<{ game_id: string; platform: string; view_count: number }[]> {
  const { data, error } = await (supabase as any)
    .from('game_view_platforms')
    .select('game_id, platform, view_count')

  if (error || !data) return []
  return data as any[]
}
