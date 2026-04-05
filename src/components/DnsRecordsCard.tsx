import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DnsRecords } from '../lib/dns'
import { formatAssignmentStyleReport } from '../lib/dnsReport'
import type { LastResolveMeta, UiStatus } from '../hooks/useDnsResolution'

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-gradient-to-r from-cyan-500/10 via-violet-500/15 to-fuchsia-500/10 animate-pulse"
          style={{ width: `${70 - i * 15}%` }}
        />
      ))}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 animate-pulse" />
        <div className="h-20 rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-rose-500/5 animate-pulse" />
      </div>
    </div>
  )
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function DnsRecordsCard({
  records,
  status,
  lastResolveMeta,
}: {
  records: DnsRecords | null
  status: UiStatus
  lastResolveMeta: LastResolveMeta | null
}) {
  const loading = status === 'resolving' && !records
  const [copyLabel, setCopyLabel] = useState<string | null>(null)

  const flash = useCallback((label: string) => {
    setCopyLabel(label)
    window.setTimeout(() => setCopyLabel(null), 2000)
  }, [])

  const onCopyReport = useCallback(async () => {
    if (!records) return
    const ok = await copyToClipboard(formatAssignmentStyleReport(records))
    flash(ok ? 'Report copied' : 'Copy failed')
  }, [flash, records])

  const metaLine =
    records && lastResolveMeta
      ? lastResolveMeta.fromCache
        ? 'Last resolve: from app cache (no network)'
        : `Last resolve: ${lastResolveMeta.durationMs} ms · ${lastResolveMeta.resolverSummary || 'DoH'}`
      : null

  return (
    <motion.section
      className="glass glass-vivid rounded-3xl p-6"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      aria-labelledby="dns-records-heading"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 id="dns-records-heading" className="text-[15px] font-semibold text-gradient">
          DNS Records
        </h2>
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-200/90">
          {loading ? 'resolving' : records ? 'live' : 'waiting'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Skeleton />
          </motion.div>
        )}

        {!loading && !records && (
          <motion.p
            key="empty"
            className="py-4 text-center font-mono text-[13px] text-violet-300/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Query a domain to see A, NS, and MX data.
          </motion.p>
        )}

        {records && (
          <motion.div
            key={`${records.domain}:${records.primaryIp}:${records.A.join('|')}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {metaLine && (
              <p className="mb-3 font-mono text-[10px] text-violet-200/75" aria-live="polite">
                {metaLine}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Domain', value: records.domain, accent: false },
                { label: 'Primary A', value: records.primaryIp, accent: true },
                { label: 'Types', value: 'A · NS · MX', accent: false },
              ].map((c) => (
                <div
                  key={c.label}
                  className={`rounded-2xl border p-4 ${
                    c.accent
                      ? 'border-cyan-400/25 bg-gradient-to-br from-cyan-950/40 to-black/50 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                      : 'border-white/10 bg-black/35'
                  }`}
                >
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-violet-300/55">{c.label}</p>
                  <p className={`break-all font-mono text-[13px] ${c.accent ? 'text-cyan-300' : 'text-white/90'}`}>{c.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/25 to-black/50 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-fuchsia-300/60">Plain-text report</p>
                  <p className="text-[11px] text-violet-200/70">
                    Updates when you click <strong className="text-cyan-200">Resolve</strong> (no background polling).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onCopyReport()}
                  className="shrink-0 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 font-mono text-[10px] text-fuchsia-200/90 transition-all hover:border-cyan-400/35 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  Copy report
                </button>
              </div>
              {copyLabel && (
                <p className="mb-2 font-mono text-[10px] text-lime-300/90" role="status">
                  {copyLabel}
                </p>
              )}
              <pre
                key={records.domain}
                className="custom-scroll max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-white/85"
              >
                {formatAssignmentStyleReport(records)}
              </pre>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-500/15 bg-black/30">
              <table className="w-full text-left font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-cyan-950/50 via-violet-950/40 to-fuchsia-950/50">
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-cyan-200/70">Type</th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-violet-200/70">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {records.A.map((ip) => (
                    <tr key={ip} className="transition-colors hover:bg-cyan-500/[0.06]">
                      <td className="px-4 py-2.5 font-semibold text-cyan-300">A</td>
                      <td className="px-4 py-2.5 text-white/88">{ip}</td>
                    </tr>
                  ))}
                  {records.NS.map((ns) => (
                    <tr key={ns} className="transition-colors hover:bg-violet-500/[0.06]">
                      <td className="px-4 py-2.5 font-semibold text-violet-300/90">NS</td>
                      <td className="px-4 py-2.5 text-white/85">{ns.endsWith('.') ? ns : `${ns}.`}</td>
                    </tr>
                  ))}
                  {records.MX.map((mx) => (
                    <tr key={`${mx.p}-${mx.h}`} className="transition-colors hover:bg-fuchsia-500/[0.06]">
                      <td className="px-4 py-2.5 font-semibold text-fuchsia-300/90">MX</td>
                      <td className="px-4 py-2.5 text-white/80">
                        {mx.p} {mx.h.endsWith('.') ? mx.h : `${mx.h}.`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
