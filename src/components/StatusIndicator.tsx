import { motion } from 'framer-motion'
import type { UiStatus } from '../hooks/useDnsResolution'

const config: Record<UiStatus, { label: string; dot: string; ring: string; pulse: boolean }> = {
  idle: {
    label: 'Idle',
    dot: 'bg-white/30',
    ring: 'shadow-[0_0_12px_rgba(255,255,255,0.08)]',
    pulse: false,
  },
  resolving: {
    label: 'Resolving',
    dot: 'bg-cyan-400',
    ring: 'shadow-[0_0_14px_rgba(34,211,238,0.75)]',
    pulse: true,
  },
  success: {
    label: 'Resolved',
    dot: 'bg-lime-400',
    ring: 'shadow-[0_0_14px_rgba(163,230,53,0.55)]',
    pulse: false,
  },
  error: {
    label: 'Error',
    dot: 'bg-rose-400',
    ring: 'shadow-[0_0_12px_rgba(251,113,133,0.5)]',
    pulse: false,
  },
}

export function StatusIndicator({ status }: { status: UiStatus }) {
  const c = config[status]
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/12 bg-[#000000] px-3.5 py-2 font-mono text-[11px] text-violet-100/85 shadow-[0_0_20px_rgba(167,139,250,0.06)]">
      <motion.span
        className={`h-2 w-2 rounded-full ${c.dot} ${c.ring}`}
        animate={c.pulse ? { scale: [1, 1.35, 1], opacity: [1, 0.55, 1] } : {}}
        transition={c.pulse ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
      />
      {c.label}
    </div>
  )
}
