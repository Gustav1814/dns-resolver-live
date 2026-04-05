import { useCallback, useRef, useState } from 'react'
import {
  buildRecords,
  emptyMessage,
  CacheEntry,
  DnsRecords,
  fetchA,
  fetchAuthNS,
  fetchMX,
  fetchTLDNS,
  getDohRequestSummary,
  LogEntry,
  MessageState,
  newLog,
  queryMessage,
  replyMessage,
  resetDohRequestLog,
  ResolutionMode,
} from '../lib/dns'
import {
  emptyTopology,
  type TopoEdgeVariant,
  type TopoNodeId,
  type TopologyState,
} from '../lib/topology'

export type UiStatus = 'idle' | 'resolving' | 'success' | 'error'

export type LastResolveMeta = {
  durationMs: number
  resolverSummary: string
  fromCache: boolean
}

const CACHE_MAX = 5

let qIdCtr = 0x1a2b
function nextQId() {
  qIdCtr = (qIdCtr + 0x0047) & 0xffff
  return qIdCtr
}

function idHex(id: number) {
  return `0x${id.toString(16).toUpperCase().padStart(4, '0')}`
}

export function useDnsResolution() {
  const [status, setStatus] = useState<UiStatus>('idle')
  const [stepDesc, setStepDesc] = useState<string>(
    'Enter a domain and click Resolve. Live queries use Cloudflare DNS-over-HTTPS (1.1.1.1).',
  )
  const [logs, setLogs] = useState<LogEntry[]>([
    newLog('—', 'info', 'Ready. Resolution traces use Cloudflare DoH in real time.'),
  ])
  const [records, setRecords] = useState<DnsRecords | null>(null)
  const [message, setMessage] = useState<MessageState>(emptyMessage())
  const [cache, setCache] = useState<Record<string, CacheEntry>>({})
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [flushNotice, setFlushNotice] = useState<string | null>(null)
  const [mode, setMode] = useState<ResolutionMode>('recursive')
  const [speedMs, setSpeedMs] = useState(900)
  const [activeHostDomain, setActiveHostDomain] = useState('gaia.cs.umass.edu')
  const [tldLabel, setTldLabel] = useState('…')
  const [authLabel, setAuthLabel] = useState('…')
  const [topology, setTopology] = useState<TopologyState>(emptyTopology())
  const [bypassCache, setBypassCache] = useState(false)
  const [lastQueryDomain, setLastQueryDomain] = useState('')
  const [lastResolveMeta, setLastResolveMeta] = useState<LastResolveMeta | null>(null)
  const edgeSeq = useRef(0)

  const runningRef = useRef(false)

  const resetTopo = useCallback(() => {
    edgeSeq.current = 0
    setTopology(emptyTopology())
  }, [])

  const setLit = useCallback((lit: TopoNodeId | null) => {
    setTopology((t) => ({ ...t, lit }))
  }, [])

  const setFetching = useCallback((fetching: TopoNodeId | null) => {
    setTopology((t) => ({ ...t, fetching }))
  }, [])

  const pushEdge = useCallback(
    (from: TopoNodeId, to: TopoNodeId, label: string, variant: TopoEdgeVariant) => {
      edgeSeq.current += 1
      const id = `e-${edgeSeq.current}`
      setTopology((t) => ({
        ...t,
        edges: [...t.edges, { id, from, to, label, variant }],
      }))
    },
    [],
  )

  const wait = useCallback((ms: number) => new Promise((r) => setTimeout(r, ms)), [])

  const appendLog = useCallback((entry: LogEntry) => {
    setLogs((L) => [...L, entry])
  }, [])

  const addCache = useCallback((domain: string, ip: string, rec: DnsRecords) => {
    setCache((prev) => {
      const next = { ...prev }
      const keys = Object.keys(next)
      if (keys.length >= CACHE_MAX) {
        const oldest = keys[0]
        delete next[oldest]
        setFlushNotice(`Oldest entry removed: ${oldest}`)
        appendLog(
          newLog('⚠', 'cache', `Cache full. Removed <strong>${oldest}</strong>.`),
        )
      }
      next[domain] = { ip, rec, ttl: 300 }
      return next
    })
  }, [appendLog])

  const clear = useCallback(() => {
    resetTopo()
    setLogs([newLog('—', 'info', 'Log cleared.')])
    setCache({})
    setRecords(null)
    setErrorBanner(null)
    setFlushNotice(null)
    setMessage(emptyMessage())
    setStatus('idle')
    setStepDesc(
      'Enter a domain and click Resolve. Live queries use Cloudflare DNS-over-HTTPS (1.1.1.1).',
    )
    setTldLabel('…')
    setAuthLabel('…')
    setLastResolveMeta(null)
    setLastQueryDomain('')
  }, [resetTopo])

  const clearLogs = useCallback(() => {
    setLogs([newLog('—', 'info', 'Log cleared.')])
  }, [])

  const runRecursive = useCallback(
    async (domain: string, curId: number, spd: number) => {
      const tld = domain.split('.').slice(-1)[0]

      setLit('Host')
      pushEdge('Host', 'Local', '1 · query', 'query')
      setStepDesc(
        `<span class="font-mono text-accent">1</span> Host sends query to Local DNS. Query ID <strong class="font-mono">${idHex(curId)}</strong> · Flags QR=0 RD=1`,
      )
      appendLog(newLog('1', 'query', `Host → Local DNS: <strong>${domain}</strong>`))
      await wait(spd)

      setLit('Local')
      pushEdge('Local', 'Root', '2 · query', 'query')
      setStepDesc(
        `<span class="font-mono text-accent">2</span> Local DNS forwards to Root. Fetching .${tld} NS via DoH…`,
      )
      appendLog(newLog('2', 'query', `Local DNS → Root: <strong>${domain}</strong>`))
      setFetching('Root')
      const tldNS = await fetchTLDNS(tld)
      setFetching(null)
      setTldLabel(tldNS[0])
      await wait(spd * 0.25)

      setLit('Root')
      pushEdge('Root', 'Local', '3 · referral', 'referral')
      setStepDesc(
        `<span class="font-mono text-accent">3</span> Root returns referral to TLD: <strong class="font-mono text-white/90">${tldNS[0]}</strong>`,
      )
      appendLog(
        newLog('3', 'reply', `Root → Local: referral to TLD <strong>${tldNS[0]}</strong>`),
      )
      await wait(spd)

      setLit('Local')
      pushEdge('Local', 'Tld', '4 · query', 'query')
      setStepDesc(
        `<span class="font-mono text-accent">4</span> Local queries TLD for <strong>${domain}</strong>…`,
      )
      appendLog(newLog('4', 'query', `Local DNS → TLD: <strong>${domain}</strong>`))
      setFetching('Tld')
      const authNS = await fetchAuthNS(domain)
      setFetching(null)
      setAuthLabel(authNS[0])
      await wait(spd * 0.25)

      setLit('Tld')
      pushEdge('Tld', 'Local', '5 · referral', 'referral')
      setStepDesc(
        `<span class="font-mono text-accent">5</span> TLD returns authoritatives: <strong class="font-mono text-white/90">${authNS[0]}</strong>`,
      )
      appendLog(
        newLog('5', 'reply', `TLD → Local: referral <strong>${authNS[0]}</strong>`),
      )
      await wait(spd)

      setLit('Local')
      pushEdge('Local', 'Auth', '6 · query', 'query')
      setStepDesc(
        `<span class="font-mono text-accent">6</span> Local queries authoritative for A and MX…`,
      )
      appendLog(newLog('6', 'query', `Local DNS → Auth: <strong>${domain}</strong>`))
      setFetching('Auth')
      const [aRec, mxRec] = await Promise.all([fetchA(domain), fetchMX(domain)])
      setFetching(null)
      const rec = buildRecords(domain, aRec, authNS, mxRec)
      await wait(spd * 0.25)

      setMessage(replyMessage(domain, rec, idHex(curId)))
      setLit('Auth')
      pushEdge('Auth', 'Local', '7 · answer', 'answer')
      setStepDesc(
        `<span class="font-mono text-accent">7</span> Authoritative answer: <strong class="font-mono text-white">${rec.primaryIp}</strong>`,
      )
      appendLog(
        newLog('7', 'reply', `Auth → Local: <strong>${domain}</strong> = ${rec.primaryIp}`),
      )
      await wait(spd)

      addCache(domain, rec.primaryIp, rec)
      appendLog(
        newLog('💾', 'cache', `Cached <strong>${domain}</strong> → ${rec.primaryIp} (TTL 300s)`),
      )

      setLit('Local')
      pushEdge('Local', 'Host', '8 · answer', 'answer')
      setStepDesc(
        `<span class="font-mono text-accent">8</span> Local DNS returns result to host.`,
      )
      appendLog(
        newLog('8', 'reply', `Local → Host: <strong>${domain}</strong> = ${rec.primaryIp}`),
      )
      await wait(spd)

      setLit('Host')
      setRecords(rec)
      setStatus('success')
      setStepDesc(
        `Resolution complete. <strong class="font-mono">${domain}</strong> → <strong class="font-mono">${rec.primaryIp}</strong>`,
      )
      appendLog(newLog('✓', 'reply', `Done: <strong>${domain}</strong> = ${rec.primaryIp}`))
      await wait(200)
      setLit(null)
    },
    [addCache, appendLog, pushEdge, setFetching, setLit, wait],
  )

  const runIterative = useCallback(
    async (domain: string, curId: number, spd: number) => {
      const tld = domain.split('.').slice(-1)[0]

      setLit('Host')
      pushEdge('Host', 'Local', '1 · query', 'query')
      setStepDesc(
        `<span class="font-mono text-accent">1</span> Host sends iterative query to Local DNS.`,
      )
      appendLog(newLog('1', 'query', `Host → Local (iterative): <strong>${domain}</strong>`))
      await wait(spd)

      setLit('Local')
      pushEdge('Local', 'Root', '2 · query', 'query')
      setStepDesc(`<span class="font-mono text-accent">2</span> Local queries Root directly…`)
      appendLog(newLog('2', 'query', `Local → Root: <strong>${domain}</strong>`))
      setFetching('Root')
      const tldNS = await fetchTLDNS(tld)
      setFetching(null)
      setTldLabel(tldNS[0])
      await wait(spd * 0.25)

      setLit('Root')
      pushEdge('Root', 'Local', '3 · referral', 'referral')
      setStepDesc(
        `<span class="font-mono text-accent">3</span> Root: try TLD <strong class="font-mono">${tldNS[0]}</strong>`,
      )
      appendLog(newLog('3', 'reply', `Root → Local: try TLD <strong>${tldNS[0]}</strong>`))
      await wait(spd)

      setLit('Local')
      pushEdge('Local', 'Tld', '4 · query', 'query')
      setStepDesc(`<span class="font-mono text-accent">4</span> Local queries TLD…`)
      appendLog(newLog('4', 'query', `Local → TLD: <strong>${domain}</strong>`))
      setFetching('Tld')
      const authNS = await fetchAuthNS(domain)
      setFetching(null)
      setAuthLabel(authNS[0])
      await wait(spd * 0.25)

      setLit('Tld')
      pushEdge('Tld', 'Local', '5 · referral', 'referral')
      setStepDesc(
        `<span class="font-mono text-accent">5</span> TLD: try Auth <strong class="font-mono">${authNS[0]}</strong>`,
      )
      appendLog(newLog('5', 'reply', `TLD → Local: try <strong>${authNS[0]}</strong>`))
      await wait(spd)

      setLit('Local')
      pushEdge('Local', 'Auth', '6 · query', 'query')
      setStepDesc(`<span class="font-mono text-accent">6</span> Local queries authoritative…`)
      appendLog(newLog('6', 'query', `Local → Auth: <strong>${domain}</strong>`))
      setFetching('Auth')
      const [aRec, mxRec] = await Promise.all([fetchA(domain), fetchMX(domain)])
      setFetching(null)
      const rec = buildRecords(domain, aRec, authNS, mxRec)
      await wait(spd * 0.25)

      setMessage(replyMessage(domain, rec, idHex(curId)))
      setLit('Auth')
      pushEdge('Auth', 'Local', '7 · answer', 'answer')
      setStepDesc(
        `<span class="font-mono text-accent">7</span> Definitive: <strong class="font-mono">${rec.primaryIp}</strong>`,
      )
      appendLog(
        newLog('7', 'reply', `Auth → Local: <strong>${domain}</strong> = ${rec.primaryIp}`),
      )
      await wait(spd)

      addCache(domain, rec.primaryIp, rec)
      appendLog(
        newLog('💾', 'cache', `Cached <strong>${domain}</strong> → ${rec.primaryIp}`),
      )

      setLit('Local')
      pushEdge('Local', 'Host', '8 · answer', 'answer')
      setStepDesc(`<span class="font-mono text-accent">8</span> Local delivers answer to host.`)
      appendLog(
        newLog('8', 'reply', `Local → Host: <strong>${domain}</strong> = ${rec.primaryIp}`),
      )
      await wait(spd)

      setLit('Host')
      setRecords(rec)
      setStatus('success')
      setStepDesc(
        `Iterative complete. Local performed each hop. <strong class="font-mono">${rec.primaryIp}</strong>`,
      )
      appendLog(newLog('✓', 'reply', `Done: <strong>${domain}</strong> = ${rec.primaryIp}`))
      await wait(200)
      setLit(null)
    },
    [addCache, appendLog, pushEdge, setFetching, setLit, wait],
  )

  const resolve = useCallback(
    async (rawDomain: string) => {
      if (runningRef.current) return
      const domain = rawDomain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .split('?')[0]
      if (!domain) return

      runningRef.current = true
      setLastQueryDomain(domain)
      setErrorBanner(null)
      setFlushNotice(null)
      setRecords(null)
      setLastResolveMeta(null)
      resetTopo()
      setActiveHostDomain(domain)
      setTldLabel('…')
      setAuthLabel('…')

      const curId = nextQId()
      setMessage(queryMessage(domain, idHex(curId)))

      const spd = speedMs
      const cached = cache[domain]
      if (cached && !bypassCache) {
        appendLog(
          newLog(
            '💾',
            'cache',
            `Cache hit: <strong>${domain}</strong> → <strong>${cached.ip}</strong>`,
          ),
        )
        setStepDesc(
          `Served from cache. <strong class="font-mono">${cached.ip}</strong> · no upstream queries`,
        )
        setMessage(replyMessage(domain, cached.rec, idHex(curId)))
        setRecords(cached.rec)
        setStatus('success')
        setLastResolveMeta({ durationMs: 0, resolverSummary: 'cache', fromCache: true })
        runningRef.current = false
        return
      }

      if (cached && bypassCache) {
        appendLog(
          newLog(
            '↷',
            'info',
            `Bypassing cache for <strong>${domain}</strong>; live DoH lookup.`,
          ),
        )
      }

      setStatus('resolving')
      resetDohRequestLog()
      const t0 = Date.now()
      setLogs((L) => [
        ...L,
        newLog(
          '→',
          'info',
          `Live lookup <strong>${domain}</strong> · ID ${idHex(curId)} · DoH (Cloudflare, then Google if needed)`,
        ),
      ])

      try {
        if (mode === 'recursive') await runRecursive(domain, curId, spd)
        else await runIterative(domain, curId, spd)
        setLastResolveMeta({
          durationMs: Date.now() - t0,
          resolverSummary: getDohRequestSummary(),
          fromCache: false,
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setErrorBanner(msg)
        setStatus('error')
        setLastResolveMeta(null)
        appendLog(newLog('✗', 'error', msg))
        setStepDesc(`Resolution failed: ${msg}`)
        setTopology((t) => ({ ...t, lit: null, fetching: null }))
      }

      runningRef.current = false
    },
    [appendLog, bypassCache, cache, mode, resetTopo, runIterative, runRecursive, speedMs],
  )

  const retryResolve = useCallback(() => {
    if (lastQueryDomain) void resolve(lastQueryDomain)
  }, [lastQueryDomain, resolve])

  return {
    status,
    stepDesc,
    logs,
    records,
    message,
    cache,
    errorBanner,
    flushNotice,
    mode,
    setMode,
    speedMs,
    setSpeedMs,
    activeHostDomain,
    tldLabel,
    authLabel,
    resolve,
    retryResolve,
    clear,
    clearLogs,
    topology,
    bypassCache,
    setBypassCache,
    lastQueryDomain,
    lastResolveMeta,
  }
}
