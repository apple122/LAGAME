import { supabase } from './supabase'

const SGDB_BASE = 'https://www.steamgriddb.com/api/v2'

/**
 * Get the SteamGridDB API key from Supabase (category = 'steamgriddb')
 */
async function getSteamGridDbKey(): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from('gemini_api_keys')
    .select('api_key')
    .eq('is_active', true)
    .eq('category', 'steamgriddb')
    .limit(1)
    .single()

  if (error || !data) return null
  return (data as { api_key: string }).api_key
}

/**
 * Search for a game by name and return the first matching SGDB game ID
 */
export async function searchSteamGridDbGame(name: string): Promise<{ id: number; name: string } | null> {
  const apiKey = await getSteamGridDbKey()
  if (!apiKey) {
    console.warn('SteamGridDB: No active API key found in database.')
    return null
  }

  try {
    const res = await fetch(`${SGDB_BASE}/search/autocomplete/${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) throw new Error(`SGDB search failed: ${res.status}`)
    const json = await res.json()
    if (!json.success || !json.data?.length) return null
    return { id: json.data[0].id, name: json.data[0].name }
  } catch (e) {
    console.error('SteamGridDB search error:', e)
    return null
  }
}

/**
 * Get game info by Steam App ID from SteamGridDB
 */
export async function getSteamGridDbGameBySteamId(steamAppId: number): Promise<{ id: number; name: string } | null> {
  const apiKey = await getSteamGridDbKey()
  if (!apiKey) return null

  try {
    const res = await fetch(`${SGDB_BASE}/games/steam/${steamAppId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    if (!json.success || !json.data) return null
    return { id: json.data.id, name: json.data.name }
  } catch (e) {
    console.error('SteamGridDB game lookup error:', e)
    return null
  }
}

/**
 * Fetch the best cover/grid image (600x900 portrait) for a game
 */
export async function getSteamGridDbCover(gameId: number): Promise<string | null> {
  const apiKey = await getSteamGridDbKey()
  if (!apiKey) return null

  try {
    // Prefer portrait/600x900 style grids (p = portrait)
    const res = await fetch(`${SGDB_BASE}/grids/game/${gameId}?dimensions=600x900`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) throw new Error(`SGDB cover failed: ${res.status}`)
    const json = await res.json()
    if (json.success && json.data?.length > 0) {
      return json.data[0].url
    }
    // Fallback: try any grid
    const res2 = await fetch(`${SGDB_BASE}/grids/game/${gameId}?limit=1`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const json2 = await res2.json()
    if (json2.success && json2.data?.length > 0) {
      return json2.data[0].url
    }
    return null
  } catch (e) {
    console.error('SteamGridDB cover error:', e)
    return null
  }
}

/**
 * Fetch hero/banner images for a game
 */
export async function getSteamGridDbHeroes(gameId: number, limit = 8): Promise<string[]> {
  const apiKey = await getSteamGridDbKey()
  if (!apiKey) return []

  try {
    const res = await fetch(`${SGDB_BASE}/heroes/game/${gameId}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    if (!json.success || !json.data?.length) return []
    return json.data.map((item: any) => item.url)
  } catch (e) {
    console.error('SteamGridDB heroes error:', e)
    return []
  }
}

/**
 * Fetch screenshot-style (wide/horizontal) grids as "screenshots"
 */
export async function getSteamGridDbScreenshots(gameId: number, limit = 8): Promise<string[]> {
  const apiKey = await getSteamGridDbKey()
  if (!apiKey) return []

  try {
    const res = await fetch(`${SGDB_BASE}/grids/game/${gameId}?dimensions=920x430,460x215&limit=${limit}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    if (!json.success || !json.data?.length) return []
    return json.data.map((item: any) => item.url)
  } catch (e) {
    console.error('SteamGridDB screenshots error:', e)
    return []
  }
}

/**
 * One-stop function: Given a game name and optional Steam App ID,
 * returns the best cover + screenshots from SteamGridDB
 */
export async function fetchSteamGridDbImages(
  gameName: string,
  steamAppId?: number
): Promise<{ cover: string | null; screenshots: string[] }> {
  let gameId: number | null = null

  // Try by steam app ID first (more accurate)
  if (steamAppId) {
    const byId = await getSteamGridDbGameBySteamId(steamAppId)
    if (byId) gameId = byId.id
  }

  // Fallback: search by name
  if (!gameId) {
    const byName = await searchSteamGridDbGame(gameName)
    if (byName) gameId = byName.id
  }

  if (!gameId) {
    console.warn(`SteamGridDB: Could not find game "${gameName}"`)
    return { cover: null, screenshots: [] }
  }

  // Fetch cover and heroes (use heroes as screenshots — they look great)
  const [cover, heroes] = await Promise.all([
    getSteamGridDbCover(gameId),
    getSteamGridDbHeroes(gameId, 8),
  ])

  return { cover, screenshots: heroes }
}
