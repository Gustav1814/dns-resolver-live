import { lazy, Suspense, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusIndicator } from './components/StatusIndicator'
import { DomainSearch } from './components/DomainSearch'
import { DnsRecordsCard } from './components/DnsRecordsCard'
import { ResolutionLog } from './components/ResolutionLog'
import { StepNarrative } from './components/StepNarrative'
import { useDnsResolution } from './hooks/useDnsResolution'

const TopologyDiagram = lazy(() =>
  import('./components/TopologyDiagram').then((m) => ({ default: m.TopologyDiagram })),
)
const PacketInspector = lazy(() =>
  import('./components/PacketInspector').then((m) => ({ default: m.PacketInspector })),
)
const CachePanel = lazy(() =>
  import('./components/CachePanel').then((m) => ({ default: m.CachePanel })),
)
const SettingsPanel = lazy(() =>
  import('./components/SettingsPanel').then((m) => ({ default: m.SettingsPanel })),
)

type AppPage = 'resolve' | 'traces' | 'cache' | 'settings'

const TABS: { id: AppPage; label: string }[] = [
  { id: 'resolve', label: 'Resolve' },
  { id: 'traces', label: 'Traces' },
  { id: 'cache', label: 'Cache' },
  { id: 'settings', label: 'Settings' },
]

function PageFallback() {
  return (
    <div
      className="glass glass-vivid flex min-h-[100px] items-center justify-center rounded-3xl font-mono text-[12px] text-neon-cyan/90"
      role="status"
      aria-live="polite"
    >
      <span className="animate-pulse">Loading…</span>
    </div>
  )
}

function tabButtonClass(active: boolean) {
  return `rounded-xl px-4 py-2 text-[12px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black whitespace-nowrap ${
    active
      ? 'bg-gradient-to-r from-cyan-500/25 via-violet-500/20 to-fuchsia-500/25 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)] ring-1 ring-white/15'
      : 'text-muted hover:bg-white/[0.06] hover:text-cyan-100/90'
  }`
}

function PrimaryNavTabs({ page, setPage }: { page: AppPage; setPage: (p: AppPage) => void }) {
  return (
    <>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setPage(tab.id)}
          aria-current={page === tab.id ? 'page' : undefined}
          className={tabButtonClass(page === tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </>
  )
}

export default function App() {
  const [page, setPage] = useState<AppPage>('resolve')
  const {
    status, stepDesc, logs, records, message, cache, errorBanner,
    flushNotice, mode, setMode, speedMs, setSpeedMs,
    activeHostDomain, tldLabel, authLabel,
    resolve, retryResolve, clear, clearLogs, topology,
    bypassCache, setBypassCache, lastQueryDomain, lastResolveMeta,
  } = useDnsResolution()

  const handleResolve = useCallback((d: string) => resolve(d), [resolve])

  const liveStatus =
    status === 'resolving'
      ? `Resolving ${lastQueryDomain || 'domain'}.`
      : status === 'success'
        ? `Resolved ${lastQueryDomain || 'domain'}.`
        : status === 'error'
          ? `Resolution failed for ${lastQueryDomain || 'domain'}.`
          : ''

  return (
    <div className="app-root min-h-screen bg-[#000000]">
      <a
        href="#main-content"
        className="skip-link btn-chrome fixed left-4 top-4 z-[200] -translate-y-[200%] rounded-xl px-4 py-3 text-sm font-semibold text-black transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#000000]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="min-w-0 shrink-0">
                <h1 className="text-[18px] font-bold tracking-tight text-gradient">DNS Resolver</h1>
                <p className="font-mono text-[10px] text-gradient-subtle">Real-time · DNS-over-HTTPS</p>
              </div>
              <nav
                className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-[#000000] p-1 sm:flex"
                aria-label="Primary navigation"
              >
                <PrimaryNavTabs page={page} setPage={setPage} />
              </nav>
            </div>
            <StatusIndicator status={status} />
          </div>
          <nav
            className="mt-3 overflow-x-auto pb-1 sm:hidden [-webkit-overflow-scrolling:touch]"
            aria-label="Primary navigation"
          >
            <div className="flex w-max min-w-full gap-1 rounded-2xl border border-white/10 bg-[#000000] p-1">
              <PrimaryNavTabs page={page} setPage={setPage} />
            </div>
          </nav>
        </div>
      </header>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveStatus}
      </div>

      <main id="main-content" className="mx-auto max-w-7xl bg-[#000000] px-6 py-8" tabIndex={-1}>
        <AnimatePresence mode="wait">
          {page === 'resolve' && (
            <motion.div key="resolve" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-8">
              <DomainSearch
                resolve={handleResolve}
                clear={clear}
                status={status}
                mode={mode}
                setMode={setMode}
                speedMs={speedMs}
                setSpeedMs={setSpeedMs}
                bypassCache={bypassCache}
                setBypassCache={setBypassCache}
              />

              {errorBanner && (
                <motion.div
                  className="flex flex-col gap-3 rounded-2xl border border-rose-400/35 bg-gradient-to-br from-rose-950/50 via-black/40 to-fuchsia-950/30 px-5 py-3 shadow-[0_0_40px_rgba(251,113,133,0.12)] sm:flex-row sm:items-center sm:justify-between"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                >
                  <p className="font-mono text-[12px] text-rose-200">{errorBanner}</p>
                  {lastQueryDomain ? (
                    <button
                      type="button"
                      onClick={retryResolve}
                      className="shrink-0 rounded-xl border border-fuchsia-400/35 bg-gradient-to-r from-fuchsia-600/30 to-rose-600/30 px-4 py-2 font-mono text-[11px] text-rose-50 transition-all hover:from-fuchsia-500/40 hover:to-rose-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      Retry
                    </button>
                  ) : null}
                </motion.div>
              )}

              <StepNarrative html={stepDesc} />

              <Suspense fallback={<PageFallback />}>
                <TopologyDiagram
                  topology={topology}
                  mode={mode}
                  status={status}
                  hostDomain={activeHostDomain}
                  tldServer={tldLabel}
                  authServer={authLabel}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <DnsRecordsCard records={records} status={status} lastResolveMeta={lastResolveMeta} />
                  <ResolutionLog logs={logs} onClear={clearLogs} />
                </div>

                <PacketInspector message={message} />
              </Suspense>
            </motion.div>
          )}

          {page === 'traces' && (
            <motion.div key="traces" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResolutionLog logs={logs} onClear={clearLogs} />
            </motion.div>
          )}

          {page === 'cache' && (
            <motion.div key="cache" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Suspense fallback={<PageFallback />}>
                <CachePanel cache={cache} flushNotice={flushNotice} />
              </Suspense>
            </motion.div>
          )}

          {page === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Suspense fallback={<PageFallback />}>
                <SettingsPanel mode={mode} setMode={setMode} speedMs={speedMs} setSpeedMs={setSpeedMs} onClear={clear} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
