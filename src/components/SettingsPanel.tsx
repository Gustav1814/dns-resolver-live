import { motion } from 'framer-motion'

const SPEED_PRESETS: { label: string; ms: number }[] = [
  { label: 'Fast', ms: 400 },
  { label: 'Normal', ms: 900 },
  { label: 'Slow', ms: 1600 },
]

export function SettingsPanel({
  mode,
  setMode,
  speedMs,
  setSpeedMs,
  onClear,
}: {
  mode: string
  setMode: (m: 'recursive' | 'iterative') => void
  speedMs: number
  setSpeedMs: (n: number) => void
  onClear: () => void
}) {
  return (
    <motion.div className="glass glass-vivid rounded-3xl p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="mb-6 text-[16px] font-semibold text-gradient">Settings</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-950/25 to-black/50 p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-cyan-200/55">Resolution Mode</p>
          <div className="flex flex-wrap gap-2">
            {(['recursive', 'iterative'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-xl px-4 py-2 text-[12px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  mode === m
                    ? 'bg-gradient-to-r from-cyan-500/25 to-violet-500/25 text-cyan-100 ring-1 ring-cyan-400/35 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                    : 'bg-black/40 text-violet-200/65 hover:bg-violet-500/10 hover:text-white'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-fuchsia-500/15 bg-gradient-to-br from-fuchsia-950/25 to-black/50 p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-fuchsia-200/55">Animation Speed</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {SPEED_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSpeedMs(p.ms)}
                className={`rounded-xl px-3 py-1.5 font-mono text-[11px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  speedMs === p.ms
                    ? 'bg-gradient-to-r from-fuchsia-500/25 to-rose-500/20 text-fuchsia-100 ring-1 ring-fuchsia-400/35'
                    : 'bg-black/40 text-violet-200/65 hover:bg-fuchsia-500/10 hover:text-white'
                }`}
              >
                {p.label} ({p.ms}ms)
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={speedMs}
              onChange={(e) => setSpeedMs(+e.target.value)}
              aria-label="Animation step delay in milliseconds"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-cyan-900/40 to-fuchsia-900/40 accent-fuchsia-400 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-fuchsia-400"
            />
            <span className="w-14 text-right font-mono text-[12px] text-fuchsia-200/75">{speedMs}ms</span>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-black/50 p-4 sm:col-span-2">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-rose-200/55">Data</p>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-rose-400/35 bg-gradient-to-r from-rose-600/25 to-orange-600/20 px-4 py-2 text-[12px] text-rose-100 transition-all hover:border-rose-300/45 hover:from-rose-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </motion.div>
  )
}
