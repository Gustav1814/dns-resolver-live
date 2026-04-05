export type ResolutionMode = 'recursive' | 'iterative'

export type LogKind = 'query' | 'reply' | 'cache' | 'info' | 'error'

export interface LogEntry {
  id: string
  step: string
  kind: LogKind
  html: string
  at: string
}

export interface DnsRecords {
  domain: string
  primaryIp: string
  A: string[]
  NS: string[]
  MX: { p: number; h: string }[]
}

export interface MessageState {
  label: string
  idHex: string
  /** Decoded flag bits (teaching view). */
  flags: string
  /** Standard query 0x0100; typical positive response 0x8180 (RFC 1035 layout). */
  flagsHex: string
  qCount: number
  aCount: number
  nsCount: number
  addCount: number
  question: string
  answers: string
  authority: string
  additional: string
  answersFilled: boolean
  authorityFilled: boolean
  additionalFilled: boolean
}

export interface CacheEntry {
  ip: string
  rec: DnsRecords
  ttl: number
}

const TYPE_NUM = { A: 1, NS: 2, MX: 15, CNAME: 5, AAAA: 28 } as const

type DohJson = { Answer?: Array<{ type: number; data: string }> }

let dohRequestLog: ('cloudflare' | 'google')[] = []

/** Call at the start of a live lookup (not cache hit) to attribute resolvers in the UI. */
export function resetDohRequestLog() {
  dohRequestLog = []
}

/** Human-readable summary of which public DoH endpoints answered during the last lookup. */
export function getDohRequestSummary(): string {
  if (!dohRequestLog.length) return ''
  const c = dohRequestLog.filter((x) => x === 'cloudflare').length
  const g = dohRequestLog.filter((x) => x === 'google').length
  if (c && g) return `Cloudflare (${c} queries) · Google (${g} queries)`
  if (c) return 'Cloudflare'
  return 'Google'
}

function cloudflareDohUrl(name: string, type: keyof typeof TYPE_NUM): string {
  const custom = import.meta.env.VITE_DOH_CLOUDFLARE_URL?.trim()
  if (custom) {
    return custom
      .replaceAll('{name}', encodeURIComponent(name))
      .replaceAll('{type}', type)
  }
  return `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`
}

function googleDohUrl(name: string, type: keyof typeof TYPE_NUM): string {
  const num = TYPE_NUM[type]
  const custom = import.meta.env.VITE_DOH_GOOGLE_URL?.trim()
  if (custom) {
    return custom.replaceAll('{name}', encodeURIComponent(name)).replaceAll('{type}', String(num))
  }
  return `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${num}`
}

/**
 * Browser → public DoH only (no dev-server proxy: Node-side TLS often hits ECONNRESET behind strict networks).
 * Tries Cloudflare first, then Google Public DNS JSON — same RR shape for our parsers.
 */
export async function doh(name: string, type: keyof typeof TYPE_NUM): Promise<DohJson> {
  const cfUrl = cloudflareDohUrl(name, type)

  try {
    const r = await fetch(cfUrl, { headers: { Accept: 'application/dns-json' } })
    if (r.ok) {
      dohRequestLog.push('cloudflare')
      return (await r.json()) as DohJson
    }
  } catch {
    /* try Google */
  }

  const gUrl = googleDohUrl(name, type)

  try {
    const r = await fetch(gUrl, { headers: { Accept: 'application/json' } })
    if (!r.ok) throw new Error(`DoH ${r.status}`)
    const j = (await r.json()) as DohJson
    dohRequestLog.push('google')
    return { Answer: j.Answer }
  } catch {
    throw new Error(
      'Could not reach DNS-over-HTTPS (tried Cloudflare and Google). Check network, VPN, firewall, or extensions blocking DoH.',
    )
  }
}

function extractRR(
  data: { Answer?: Array<{ type: number; data: string }> },
  type: keyof typeof TYPE_NUM,
): string[] {
  if (!data?.Answer) return []
  const n = TYPE_NUM[type]
  return data.Answer.filter((r) => r.type === n).map((r) =>
    r.data.replace(/\.$/, '').trim(),
  )
}

export async function fetchTLDNS(tld: string) {
  try {
    const data = await doh(tld, 'NS')
    const ns = extractRR(data, 'NS')
    return ns.length ? ns : [`a.${tld}-servers.net`]
  } catch {
    return [`a.${tld}-servers.net`]
  }
}

export async function fetchAuthNS(domain: string) {
  const data = await doh(domain, 'NS')
  const ns = extractRR(data, 'NS')
  if (!ns.length) throw new Error(`No NS records found for ${domain}`)
  return ns
}

export async function fetchA(domain: string) {
  const data = await doh(domain, 'A')
  let a = extractRR(data, 'A')
  if (!a.length) {
    const data6 = await doh(domain, 'AAAA')
    a = extractRR(data6, 'AAAA')
  }
  if (!a.length) throw new Error(`No A or AAAA records found for ${domain}`)
  return a
}

export async function fetchMX(domain: string) {
  try {
    const data = await doh(domain, 'MX')
    if (!data?.Answer) return []
    return data.Answer.filter((r) => r.type === 15).map((r) => {
      const p = r.data.trim().split(/\s+/)
      return {
        p: +p[0] || 10,
        h: (p[1] || r.data).replace(/\.$/, ''),
      }
    })
  } catch {
    return []
  }
}

export function buildRecords(
  domain: string,
  aRec: string[],
  authNS: string[],
  mxRec: { p: number; h: string }[],
): DnsRecords {
  const ip = aRec[0]
  return {
    domain,
    primaryIp: ip,
    A: aRec,
    NS: authNS,
    MX: mxRec.length ? mxRec : [{ p: 10, h: `mail.${domain}` }],
  }
}

export function emptyMessage(): MessageState {
  return {
    label: '— QUERY —',
    idHex: '0x0000',
    flags: 'QR=0 RD=1',
    flagsHex: '0x0000',
    qCount: 1,
    aCount: 0,
    nsCount: 0,
    addCount: 0,
    question: 'questions (variable # of questions)',
    answers: 'answers (variable # of RRs)',
    authority: 'authority (variable # of RRs)',
    additional: 'additional info (variable # of RRs)',
    answersFilled: false,
    authorityFilled: false,
    additionalFilled: false,
  }
}

export function queryMessage(domain: string | null, idHex: string): MessageState {
  const m = emptyMessage()
  m.label = '— QUERY —'
  m.idHex = idHex
  m.flags = 'QR=0 RD=1 RA=0 AA=0'
  m.flagsHex = '0x0100'
  if (domain) m.question = `${domain} IN A ?`
  return m
}

export function replyMessage(domain: string, rec: DnsRecords, idHex: string): MessageState {
  return {
    label: '— REPLY —',
    idHex,
    flags: 'QR=1 RD=1 RA=1 AA=1',
    flagsHex: '0x8180',
    qCount: 1,
    aCount: rec.A.length,
    nsCount: rec.NS.length,
    addCount: rec.MX.length,
    question: `${domain} IN A ?`,
    answers: rec.A.join(', '),
    authority: rec.NS.join(', '),
    additional: rec.MX.map((m) => `${m.p} ${m.h}`).join(', '),
    answersFilled: true,
    authorityFilled: true,
    additionalFilled: true,
  }
}

export function nowStamp() {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const ms = d.getMilliseconds().toString().padStart(3, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`
}

export function newLog(
  step: string,
  kind: LogKind,
  html: string,
): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    step,
    kind,
    html,
    at: nowStamp(),
  }
}
