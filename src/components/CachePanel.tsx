import { motion, AnimatePresence } from 'framer-motion'
import type { CacheEntry } from '../lib/dns'

const MAX = 5

export function CachePanel({ cache, flushNotice }: { cache: Record<string, CacheEntry>; flushNotice: string | null }) {
  const entries = Object.entries(cache)
  const n = entries.length

  return (
    <motion.section
      className="glass glass-vivid rounded-3xl p-5"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-gradient">Local Cache</h2>
        <span className="rounded-full border border-lime-400/25 bg-lime-500/10 px-2.5 py-0.5 font-mono text-[11px] text-lime-200/90">
          {n}/{MAX}
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.45)]"
          animate={{ width: `${(n / MAX) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence>
        {flushNotice && (
          <motion.p
            className="mb-3 rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-950/40 to-orange-950/30 px-3 py-2 font-mono text-[11px] text-amber-100/90"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {flushNotice}
          </motion.p>
        )}
      </AnimatePresence>

      {n === 0 ? (
        <p className="py-6 text-center font-mono text-[12px] text-violet-300/55">Cache empty.</p>
      ) : (
        <ul className="custom-scroll max-h-[200px] space-y-2 overflow-y-auto">
          <AnimatePresence initial={false}>
            {entries.map(([domain, v]) => (
              <motion.li
                key={domain}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-gradient-to-r from-black/50 via-violet-950/15 to-black/50 px-3 py-2.5 font-mono text-[11px] transition-all hover:border-cyan-400/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="min-w-0 flex-1 truncate text-white/88">{domain}</span>
                <span className="shrink-0 text-cyan-300">{v.ip}</span>
                <span className="shrink-0 text-fuchsia-300/80">TTL {v.ttl}s</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.section>
  )
}
