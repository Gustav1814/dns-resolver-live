import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { LogEntry } from '../lib/dns'
import { formatLogsPlain } from '../lib/dnsReport'

const kindClass: Record<LogEntry['kind'], string> = {
  query: 'border-l-cyan-400/70 bg-gradient-to-r from-cyan-500/[0.12] to-transparent',
  reply: 'border-l-lime-400/60 bg-gradient-to-r from-lime-500/[0.1] to-transparent',
  cache: 'border-l-violet-400/65 bg-gradient-to-r from-violet-500/[0.12] to-transparent',
  info: 'border-l-fuchsia-400/35 bg-gradient-to-r from-fuchsia-500/[0.06] to-transparent',
  error: 'border-l-rose-400/80 bg-gradient-to-r from-rose-500/[0.14] to-transparent',
}

export function ResolutionLog({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const endRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [logs, reduceMotion])

  const onCopyTrace = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatLogsPlain(logs))
      setCopyStatus('Trace copied')
    } catch {
      setCopyStatus('Copy failed')
    }
    window.setTimeout(() => setCopyStatus(null), 2000)
  }, [logs])

  const logTransition = reduceMotion ? { duration: 0 } : { duration: 0.25 }

  return (
    <section className="glass glass-vivid flex min-h-[300px] flex-col rounded-3xl" aria-labelledby="resolution-trace-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-black/20 via-violet-950/20 to-black/20 px-5 py-4">
        <h2 id="resolution-trace-heading" className="text-[15px] font-semibold text-gradient">
          Resolution Trace
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {copyStatus && (
            <span className="font-mono text-[10px] text-lime-300/90" role="status">
              {copyStatus}
            </span>
          )}
          <button
            type="button"
            onClick={() => void onCopyTrace()}
            className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 font-mono text-[10px] text-cyan-100/85 transition-all hover:border-cyan-300/40 hover:bg-cyan-500/15"
          >
            Copy trace
          </button>
          <button type="button" onClick={onClear}
            className="rounded-xl border border-white/12 bg-black/35 px-3 py-1.5 font-mono text-[10px] text-violet-200/75 transition-all hover:border-fuchsia-400/30 hover:text-fuchsia-100/90">
            Clear
          </button>
        </div>
      </div>
      <div className="custom-scroll max-h-[380px] flex-1 overflow-y-auto px-3 py-3">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              className={`mb-2 rounded-xl border border-white/[0.06] border-l-[3px] px-3 py-2.5 font-mono text-[11px] leading-relaxed shadow-sm shadow-black/20 ${kindClass[log.kind]}`}
              initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={logTransition}
            >
              <div className="mb-1 flex items-center justify-between text-[9px] text-muted">
                <span className="tabular-nums text-white/30">{log.at}</span>
                <span className="rounded-md bg-gradient-to-r from-violet-500/20 to-fuchsia-500/15 px-1.5 py-0.5 uppercase tracking-wide text-violet-200/70">{log.step}</span>
              </div>
              <div className="text-white/85 [&_strong]:font-semibold [&_strong]:text-white"
                dangerouslySetInnerHTML={{ __html: log.html }} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </section>
  )
}
