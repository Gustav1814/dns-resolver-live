import { useCallback, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { ResolutionMode } from '../lib/dns'
import type { UiStatus } from '../hooks/useDnsResolution'

const QUICK = ['google.com', 'github.com', 'cloudflare.com', 'netflix.com']

export function DomainSearch({
  resolve,
  clear,
  status,
  mode,
  setMode,
  speedMs,
  setSpeedMs,
  bypassCache,
  setBypassCache,
}: {
  resolve: (d: string) => void
  clear: () => void
  status: UiStatus
  mode: ResolutionMode
  setMode: (m: ResolutionMode) => void
  speedMs: number
  setSpeedMs: (n: number) => void
  bypassCache: boolean
  setBypassCache: (v: boolean) => void
}) {
  const reduceMotion = useReducedMotion()
  const [input, setInput] = useState('google.com')
  const running = status === 'resolving'

  const submit = useCallback(
    (domain: string) => { if (!running) resolve(domain) },
    [running, resolve],
  )

  return (
    <div className="space-y-5">
      <motion.div
        className="glass glass-vivid relative overflow-hidden rounded-3xl p-5"
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <motion.div
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-500/30 via-violet-500/18 to-transparent blur-3xl"
          aria-hidden
          animate={reduceMotion ? { opacity: 0.7 } : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-fuchsia-500/25 via-rose-500/10 to-transparent blur-3xl"
          aria-hidden
          animate={reduceMotion ? { opacity: 0.55 } : { opacity: [0.4, 0.75, 0.4] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <form
            onSubmit={(e) => { e.preventDefault(); submit(input) }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            aria-label="Resolve domain"
          >
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neon-cyan/70">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter domain name…"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                aria-label="Domain name"
                className="inner-glow-cyan h-12 w-full rounded-2xl border border-white/12 bg-black/50 pl-11 pr-4 font-mono text-[14px] text-white/95 placeholder-violet-300/25 outline-none transition-all focus:border-cyan-400/40 focus:bg-black/65 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_32px_rgba(167,139,250,0.12)]"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <motion.button
                type="submit"
                disabled={running}
                className="btn-chrome relative h-12 overflow-hidden rounded-2xl px-7 font-semibold text-black disabled:opacity-45"
                whileHover={{ scale: running ? 1 : 1.03 }}
                whileTap={{ scale: running ? 1 : 0.97 }}
              >
                <span className="relative z-10 text-[14px]">{running ? 'Resolving…' : 'Resolve'}</span>
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity hover:opacity-100" />
              </motion.button>
              <button
                type="button"
                onClick={clear}
                className="h-12 rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-[13px] text-violet-200/80 transition-all hover:border-fuchsia-400/25 hover:bg-fuchsia-500/10 hover:text-white"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-widest text-violet-300/60">Quick:</span>
            {QUICK.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setInput(d); submit(d) }}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[11px] text-cyan-200/70 transition-all hover:border-cyan-400/35 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-violet-500/15 hover:text-white"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/35 p-1 shadow-inner shadow-cyan-500/5">
          {(['recursive', 'iterative'] as ResolutionMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
                mode === m
                  ? 'bg-gradient-to-r from-violet-600/35 to-fuchsia-600/30 text-white shadow-[0_0_16px_rgba(167,139,250,0.2)] ring-1 ring-white/15'
                  : 'text-muted hover:text-cyan-200/80'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px]">
          <span className="text-violet-300/70">Speed</span>
          <input
            type="range"
            min={200}
            max={2000}
            step={100}
            value={speedMs}
            onChange={(e) => setSpeedMs(+e.target.value)}
            aria-label="Animation speed in milliseconds"
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-cyan-900/50 to-violet-900/50 accent-cyan-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-fuchsia-400"
          />
          <span className="font-mono text-cyan-200/70">{speedMs}ms</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-violet-200/75">
          <input
            type="checkbox"
            checked={bypassCache}
            onChange={(e) => setBypassCache(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-fuchsia-400/30 bg-black/40 accent-fuchsia-400"
          />
          <span>Bypass cache (force live DoH)</span>
        </label>
      </div>
    </div>
  )
}
