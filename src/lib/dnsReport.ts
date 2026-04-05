import type { DnsRecords, LogEntry } from './dns'

export function formatAssignmentStyleReport(rec: DnsRecords): string {
  const dot = (h: string) => (h.endsWith('.') ? h : `${h}.`)
  const a = rec.A.join(', ')
  const ns = rec.NS.map(dot).join(', ')
  const mx = rec.MX.map((m) => `${m.p} ${dot(m.h)}`).join(', ')
  return [
    `${rec.domain}/${rec.primaryIp}`,
    '-- DNS INFORMATION --',
    `A: ${a}`,
    `NS: ${ns}`,
    `MX: ${mx}`,
  ].join('\n')
}

/** Strip minimal HTML from log lines for clipboard export. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/strong>/gi, '')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatLogsPlain(logs: LogEntry[]): string {
  return logs.map((l) => `${l.at} [${l.step}] ${stripHtml(l.html)}`).join('\n')
}
