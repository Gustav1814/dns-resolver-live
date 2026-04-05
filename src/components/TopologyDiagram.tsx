import { useId, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ResolutionMode } from '../lib/dns'
import type { UiStatus } from '../hooks/useDnsResolution'
import {
  arrowSegment,
  layoutPositions,
  type ArrowSegmentOpts,
  type TopologyState,
  type TopoNodeId,
} from '../lib/topology'

/**
 * Tuned for the 8-step trace from useDnsResolution.
 * `ports` slide anchors along the chord tangent so Local/Host hubs do not stack every stroke.
 * `off` offsets parallel to the edge; `label` keeps chips clear of glowing lines.
 */
const EDGE_GEOMETRY: {
  off: number
  ports: { fromTangent: number; toTangent: number }
  label: { along: number; normal: number }
  /** See `arrowSegment` — avoids reverse-vertical `off` cancellation. */
  screenParallel?: { x: number; y: number }
}[] = [
  /* Host↔Local: fixed ±X parallel; `off` cancels on reverse vertical without this. */
  { off: 0, ports: { fromTangent: 0, toTangent: 0 }, label: { along: 0.24, normal: -42 }, screenParallel: { x: -28, y: 0 } },
  { off: 30, ports: { fromTangent: -32, toTangent: 16 }, label: { along: 0.38, normal: 44 } },
  { off: -32, ports: { fromTangent: -14, toTangent: 30 }, label: { along: 0.32, normal: -48 } },
  /* Local↔Tld: `along` near each `from` (not t vs 1−t on same line → same point). */
  { off: 50, ports: { fromTangent: 28, toTangent: -18 }, label: { along: 0.28, normal: 76 } },
  { off: -50, ports: { fromTangent: -16, toTangent: -32 }, label: { along: 0.26, normal: -76 } },
  { off: 34, ports: { fromTangent: 34, toTangent: -14 }, label: { along: 0.34, normal: 66 } },
  { off: -34, ports: { fromTangent: 12, toTangent: -36 }, label: { along: 0.3, normal: -66 } },
  { off: 0, ports: { fromTangent: 0, toTangent: 0 }, label: { along: 0.32, normal: 42 }, screenParallel: { x: 28, y: 0 } },
]

function labelChipWidth(text: string) {
  return Math.min(240, Math.max(80, text.length * 6.5 + 24))
}

function segmentOpts(g: (typeof EDGE_GEOMETRY)[number]): ArrowSegmentOpts {
  const o: ArrowSegmentOpts = { label: g.label, ports: g.ports }
  if (g.screenParallel) o.screenParallel = g.screenParallel
  return o
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

const NODE_CONFIG: Record<TopoNodeId, { title: string; icon: string; color: string }> = {
  Root: { title: 'Root DNS', icon: '◎', color: '192, 132, 252' },
  Tld: { title: 'TLD Server', icon: '◈', color: '74, 222, 128' },
  Auth: { title: 'Authoritative', icon: '◉', color: '251, 113, 133' },
  Local: { title: 'Local DNS', icon: '◍', color: '56, 189, 248' },
  Host: { title: 'Client Host', icon: '▣', color: '250, 204, 21' },
}

const ORDER: TopoNodeId[] = ['Root', 'Tld', 'Auth', 'Local', 'Host']

function edgeColor(variant: string): string {
  if (variant === 'query') return 'rgba(56, 189, 248, 0.95)'
  if (variant === 'answer') return 'rgba(163, 230, 53, 0.9)'
  return 'rgba(192, 132, 252, 0.45)'
}

export function TopologyDiagram({
  topology,
  mode,
  status,
  hostDomain,
  tldServer,
  authServer,
}: {
  topology: TopologyState
  mode: ResolutionMode
  status: UiStatus
  hostDomain: string
  tldServer: string
  authServer: string
}) {
  const reduceMotion = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 480 })
  const mid = useId().replace(/:/g, '')
  const mq = `topo-mq-${mid}`
  const ma = `topo-ma-${mid}`
  const mr = `topo-mr-${mid}`

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const sync = () => {
      const w = Math.max(400, el.clientWidth)
      const h = Math.min(640, Math.max(420, Math.round(w * 0.55)))
      setSize({ w, h })
      el.style.height = `${h + 64}px`
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const NP = layoutPositions(size.w, size.h)
  const hasLive = topology.edges.length > 0

  const subFor = (id: TopoNodeId) =>
    id === 'Host' ? hostDomain
    : id === 'Local' ? 'dns.poly.edu'
    : id === 'Root' ? 'a.root-servers.net'
    : id === 'Tld' ? tldServer
    : authServer

  const edgeMotionDur = reduceMotion ? 0 : 0.45
  const nodeSpring = reduceMotion
    ? { type: 'tween' as const, duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 20 }

  return (
    <section
      className="glass glass-vivid relative overflow-hidden rounded-3xl"
      aria-label="DNS resolution topology: client host, local resolver, root, TLD, and authoritative servers"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/4 top-0 h-[320px] w-[500px] -translate-y-1/4 rounded-full bg-cyan-500/[0.09] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[240px] w-[420px] translate-x-1/4 translate-y-1/4 rounded-full bg-fuchsia-500/[0.08] blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.06] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-3 border-b border-white/10 bg-gradient-to-r from-black/30 via-violet-950/15 to-black/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-gradient">Resolution Topology</h2>
          <p className="mt-0.5 font-mono text-[11px] text-violet-200/65">
            {mode === 'recursive' ? 'Recursive' : 'Iterative'} ·{' '}
            {status === 'resolving' ? 'resolving…' : hasLive ? 'trace complete' : 'ready'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-[10px] text-violet-200/75">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" /> query
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]" /> answer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]" /> referral
          </span>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative z-10 w-full"
        style={{
          background:
            'radial-gradient(ellipse at 40% 40%, rgba(34,211,238,0.06) 0%, transparent 55%), radial-gradient(ellipse at 60% 60%, rgba(192,132,252,0.05) 0%, transparent 50%)',
        }}
      >
        <svg
          role="img"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 z-0 block w-full"
          style={{ height: size.h }}
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          <defs>
            {/*
              Tip at (10,5); ref anchors tip to the stroke endpoint so the head is not buried under cards.
              markerUnits=userSpaceOnUse keeps sizing stable across stroke widths.
            */}
            <marker
              id={mq}
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L0,10 L10,5 Z" fill="rgba(56,189,248,0.98)" />
            </marker>
            <marker
              id={ma}
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L0,10 L10,5 Z" fill="rgba(163,230,53,0.95)" />
            </marker>
            <marker
              id={mr}
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L0,10 L10,5 Z" fill="rgba(192,132,252,0.75)" />
            </marker>
          </defs>

          {/*
            Draw all strokes first, then all labels. Otherwise later edges paint over earlier
            text and adjacent labels visually merge ("3 2 · referral").
          */}
          <AnimatePresence>
            {topology.edges.map((e, i) => {
              const g = EDGE_GEOMETRY[i % EDGE_GEOMETRY.length]
              const s = arrowSegment(NP[e.from], NP[e.to], g.off, 56, segmentOpts(g))
              const c = edgeColor(e.variant)
              const mk =
                e.variant === 'query' ? `url(#${mq})` : e.variant === 'answer' ? `url(#${ma})` : `url(#${mr})`
              return (
                <motion.g key={`${e.id}-stroke`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: edgeMotionDur, ease: 'easeOut' }}
                >
                  <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    stroke={c} strokeWidth={2} strokeLinecap="round"
                    strokeDasharray={e.variant === 'referral' ? '9 6' : undefined}
                    markerEnd={mk}
                    style={{ filter: `drop-shadow(0 0 4px ${c})` }}
                  />
                </motion.g>
              )
            })}
          </AnimatePresence>
          <g className="topology-edge-labels">
            {topology.edges.map((e, i) => {
              const g = EDGE_GEOMETRY[i % EDGE_GEOMETRY.length]
              const s = arrowSegment(NP[e.from], NP[e.to], g.off, 56, segmentOpts(g))
              const c = edgeColor(e.variant)
              const w = labelChipWidth(e.label)
              const h = 24
              const lx = clamp(s.lx, w / 2 + 8, size.w - w / 2 - 8)
              const ly = clamp(s.ly, h / 2 + 8, size.h - h / 2 - 8)
              return (
                <g key={`${e.id}-label`} transform={`translate(${lx},${ly})`}>
                  <title>{e.label}</title>
                  <rect
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    rx={9}
                    fill="rgba(11, 15, 20, 0.97)"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth={1}
                  />
                  <text
                    fill={c}
                    fontSize={10}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {e.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {ORDER.map((id) => {
          const p = NP[id]
          const cfg = NODE_CONFIG[id]
          const lit = topology.lit === id
          const fetching = topology.fetching === id
          const sub = subFor(id)

          return (
            <motion.div
              key={id}
              className="absolute z-20 flex w-[140px] flex-col items-center"
              style={{ left: p.x, top: p.y, x: '-50%', y: -30 }}
              whileHover={reduceMotion ? undefined : { scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                {lit && !reduceMotion && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle, rgba(${cfg.color},0.3) 0%, transparent 70%)`,
                      transform: 'scale(2.2)',
                      filter: 'blur(16px)',
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {lit && reduceMotion && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-80"
                    style={{
                      background: `radial-gradient(circle, rgba(${cfg.color},0.25) 0%, transparent 70%)`,
                      transform: 'scale(2.2)',
                      filter: 'blur(16px)',
                    }}
                  />
                )}
                <motion.div
                  className="relative flex h-[60px] w-[72px] items-center justify-center rounded-2xl border text-lg"
                  style={{
                    borderColor: lit ? `rgba(${cfg.color},0.5)` : 'rgba(255,255,255,0.1)',
                    background: lit ? `rgba(${cfg.color},0.12)` : 'rgba(255,255,255,0.04)',
                    boxShadow: lit
                      ? `0 0 24px rgba(${cfg.color},0.3), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(12px)',
                    color: lit ? `rgb(${cfg.color})` : 'rgba(255,255,255,0.6)',
                  }}
                  animate={{
                    scale: lit && !reduceMotion ? 1.08 : 1,
                    borderColor: lit ? `rgba(${cfg.color},0.5)` : 'rgba(255,255,255,0.1)',
                  }}
                  transition={nodeSpring}
                >
                  {cfg.icon}
                  {fetching && !reduceMotion && (
                    <motion.span
                      className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-t-transparent"
                      style={{ borderColor: `rgb(${cfg.color})`, borderTopColor: 'transparent' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  {fetching && reduceMotion && (
                    <span
                      className="absolute -right-1 -top-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: `rgb(${cfg.color})` }}
                      aria-hidden
                    />
                  )}
                </motion.div>
              </div>
              <div className="mt-3 w-full text-center">
                <p className="text-[11px] font-semibold text-white/90">{cfg.title}</p>
                <p className="mt-1 truncate font-mono text-[9px] text-muted" title={sub}>{sub}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
