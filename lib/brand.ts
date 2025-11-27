import { supabase } from '@/lib/supabase'

export type BrandKit = {
  id: string
  organization_id: string
  name: string
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
  font_family_heading?: string | null
  font_family_body?: string | null
  font_custom_url?: string | null
  font_custom_name?: string | null
  logo_url?: string | null
  button_style?: Record<string, any> | null
  additional_styles?: Record<string, any> | null
}

export async function fetchBrandKitForOrg(orgId: string): Promise<BrandKit | null> {
  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as BrandKit
}

function ensureStyleElement(id: string): HTMLStyleElement {
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  return el
}

export function applyBrandToDocument(kit: BrandKit | null) {
  if (!kit || typeof document === 'undefined') return
  const root = document.documentElement
  const setVar = (key: string, val?: string | null) => {
    if (val) root.style.setProperty(key, val)
  }

  setVar('--brand-primary', kit.primary_color || '#3b82f6')
  setVar('--brand-secondary', kit.secondary_color || '#10b981')
  setVar('--brand-accent', kit.accent_color || '#f59e0b')
  setVar('--brand-bg', kit.background_color || '#ffffff')
  setVar('--brand-text', kit.text_color || '#0f172a')

  const button = (kit.button_style || {}) as Record<string, any>
  setVar('--brand-button-bg', button.bg || kit.primary_color || '#3b82f6')
  setVar('--brand-button-text', button.text || '#ffffff')
  setVar('--brand-button-radius', button.radius || '9999px')

  // Fonts
  if (kit.font_custom_url && kit.font_custom_name) {
    const styleEl = ensureStyleElement('brand-custom-font')
    styleEl.textContent = `@font-face { font-family: '${kit.font_custom_name}'; src: url('${kit.font_custom_url}') format('truetype'); font-weight: 400; font-style: normal; }`
    setVar('--brand-font-heading', kit.font_custom_name)
    setVar('--brand-font-body', kit.font_custom_name)
  } else {
    setVar('--brand-font-heading', kit.font_family_heading || 'Inter')
    setVar('--brand-font-body', kit.font_family_body || 'Inter')
  }

  // Apply to body for immediate effect
  if (root) {
    document.body.style.fontFamily = `var(--brand-font-body, ${kit.font_family_body || 'Inter'})`
    document.body.style.backgroundColor = kit.background_color || ''
    document.body.style.color = kit.text_color || ''
  }
}

export async function loadAndApplyBrandForOrg(orgId: string) {
  const kit = await fetchBrandKitForOrg(orgId)
  if (kit) applyBrandToDocument(kit)
  return kit
}
