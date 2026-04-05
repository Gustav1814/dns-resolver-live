export type TopoNodeId = 'Root' | 'Tld' | 'Auth' | 'Local' | 'Host'

export type TopoEdgeVariant = 'query' | 'answer' | 'referral'

export interface TopoEdge {
  id: string
  from: TopoNodeId
  to: TopoNodeId
  label: string
  variant: TopoEdgeVariant
}

export interface TopologyState {
  edges: TopoEdge[]
  lit: TopoNodeId | null
  fetching: TopoNodeId | null
}

export function emptyTopology(): TopologyState {
  return { edges: [], lit: null, fetching: null }
}

export type TopoPoint = { x: number; y: number }

/**
 * Textbook layout with **safe insets** (node icons are ~58px; labels sit below).
 * Coordinates are **icon centers** — the UI anchors the icon box at each point.
 */
export function layoutPositions(w: number, h: number): Record<TopoNodeId, TopoPoint> {
  const padX = Math.max(64, Math.min(100, w * 0.09))
  const padTop = Math.max(64, h * 0.13)
  const padBottom = Math.max(72, h * 0.15)
  const iw = w - 2 * padX
  const ih = h - padTop - padBottom

  const xL = padX + iw * 0.07
  const xR = padX + iw * 0.93
  const xC = padX + iw * 0.5

  const y = (t: number) => padTop + ih * t

  return {
    Root: { x: xC, y: y(0.11) },
    Tld: { x: xR, y: y(0.30) },
    Auth: { x: xR, y: y(0.76) },
    Local: { x: xL, y: y(0.34) },
    Host: { x: xL, y: y(0.88) },
  }
}

export type ArrowLabelOpts = {
  /** 0 = start of drawn segment, 1 = end (after parallel offset + inset). */
  along: number
  /** Signed distance along unit normal (-uy, ux); separates labels from strokes and paired edges. */
  normal: number
}

export type ArrowPortOpts = {
  /**
   * Slide the **from** anchor along the tangent of the center→center chord (perpendicular to the edge).
   * Spreads multiple edges that share a hub (e.g. Local) so strokes do not stack on one point.
   */
  fromTangent?: number
  /** Slide the **to** anchor along the same tangent axis (signed like fromTangent). */
  toTangent?: number
}

export type ArrowSegmentOpts = {
  label?: ArrowLabelOpts
  ports?: ArrowPortOpts
  /**
   * Fixed screen-space offset (px, py) for both endpoints instead of `px = -uy * off`.
   * Use for vertical bidirectional pairs: reversing the chord flips `uy` so opposite `off`
   * values cancel and strokes coincide.
   */
  screenParallel?: { x: number; y: number }
}

/**
 * Straight-ish arrow between node **icon centers** with parallel offset.
 * `inset` pulls endpoints away from each center so lines/markers sit in the gap between
 * floating cards (HTML nodes sit above the SVG and would otherwise cover short segments).
 */
export function arrowSegment(
  from: TopoPoint,
  to: TopoPoint,
  off = 10,
  inset = 56,
  opts?: ArrowSegmentOpts,
): { x1: number; y1: number; x2: number; y2: number; mx: number; my: number; lx: number; ly: number } {
  const label = opts?.label
  const ft = opts?.ports?.fromTangent ?? 0
  const tt = opts?.ports?.toTangent ?? 0

  const dx0 = to.x - from.x
  const dy0 = to.y - from.y
  const len0 = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1
  const ux0 = dx0 / len0
  const uy0 = dy0 / len0
  const tx = -uy0
  const ty = ux0

  const fromA = { x: from.x + tx * ft, y: from.y + ty * ft }
  const toA = { x: to.x + tx * tt, y: to.y + ty * tt }

  const dx = toA.x - fromA.x
  const dy = toA.y - fromA.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len
  const uy = dy / len
  const sp = opts?.screenParallel
  const px = sp ? sp.x : -uy * off
  const py = sp ? sp.y : ux * off
  const half = len / 2
  const safeInset = Math.min(inset, Math.max(6, half - 6))
  const x1 = fromA.x + ux * safeInset + px
  const y1 = fromA.y + uy * safeInset + py
  const x2 = toA.x - ux * safeInset + px
  const y2 = toA.y - uy * safeInset + py
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const t = label?.along ?? 0.5
  const tClamped = Math.min(0.92, Math.max(0.08, t))
  const bx = x1 + (x2 - x1) * tClamped
  const by = y1 + (y2 - y1) * tClamped
  const n = label?.normal ?? 14
  const lx = bx - uy * n
  const ly = by + ux * n
  return { x1, y1, x2, y2, mx, my, lx, ly }
}
