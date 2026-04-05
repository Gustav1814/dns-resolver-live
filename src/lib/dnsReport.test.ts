import { describe, expect, it } from 'vitest'
import { formatAssignmentStyleReport, formatLogsPlain, stripHtml } from './dnsReport'
import type { DnsRecords, LogEntry } from './dns'

const sampleRec: DnsRecords = {
  domain: 'example.com',
  primaryIp: '93.184.216.34',
  A: ['93.184.216.34'],
  NS: ['a.iana-servers.net', 'b.iana-servers.net'],
  MX: [{ p: 10, h: 'mail.example.com' }],
}

describe('formatAssignmentStyleReport', () => {
  it('includes domain, A, dotted NS, and MX', () => {
    const text = formatAssignmentStyleReport(sampleRec)
    expect(text).toContain('example.com/93.184.216.34')
    expect(text).toContain('A: 93.184.216.34')
    expect(text).toContain('a.iana-servers.net.')
    expect(text).toContain('MX: 10 mail.example.com.')
  })
})

describe('stripHtml', () => {
  it('removes tags and br', () => {
    expect(stripHtml('Hello <strong>world</strong>')).toBe('Hello world')
    expect(stripHtml('a<br/>b')).toContain('a')
    expect(stripHtml('a<br/>b')).toContain('b')
  })
})

describe('formatLogsPlain', () => {
  it('joins log lines without html', () => {
    const logs: LogEntry[] = [
      { id: '1', at: '12:00', step: 'q', kind: 'query', html: 'Hi <strong>there</strong>' },
    ]
    expect(formatLogsPlain(logs)).toBe('12:00 [q] Hi there')
  })
})
