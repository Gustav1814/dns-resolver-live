import { motion } from 'framer-motion'
import type { MessageState } from '../lib/dns'

const cellTint = ['from-cyan-950/35 to-black/60', 'from-violet-950/35 to-black/60', 'from-fuchsia-950/30 to-black/60'] as const

export function PacketInspector({ message }: { message: MessageState }) {
  const cells = [
    { label: 'ID', value: message.idHex },
    { label: 'Flags', value: `${message.flags} · ${message.flagsHex}` },
    { label: 'Questions', value: String(message.qCount) },
    { label: 'Answers', value: String(message.aCount) },
    { label: 'Authority', value: String(message.nsCount) },
    { label: 'Additional', value: String(message.addCount) },
  ]

  const rows = [
    { title: 'Question', text: message.question, filled: !message.question.startsWith('questions') },
    { title: 'Answers', text: message.answers, filled: message.answersFilled },
    { title: 'Authority', text: message.authority, filled: message.authorityFilled },
    { title: 'Additional', text: message.additional, filled: message.additionalFilled },
  ]

  return (
    <motion.section
      className="glass glass-vivid rounded-3xl p-5"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-gradient">Packet Header</h2>
        <span className="rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-3 py-1 font-mono text-[10px] text-cyan-100/90 shadow-[0_0_16px_rgba(34,211,238,0.12)]">
          {message.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 font-mono text-[11px]">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={`bg-gradient-to-br px-3 py-2.5 ${cellTint[i % 3]}`}
          >
            <p className="mb-0.5 text-[9px] uppercase tracking-wider text-violet-300/55">{c.label}</p>
            <p className="text-white/92">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div
            key={row.title}
            className={`rounded-xl border px-3 py-2 font-mono text-[11px] transition-all duration-300 ${
              row.filled
                ? 'border-cyan-400/25 bg-gradient-to-r from-cyan-950/45 via-violet-950/25 to-fuchsia-950/20 text-white/92 shadow-[0_0_20px_rgba(34,211,238,0.06)]'
                : 'border-white/[0.06] bg-black/30 text-violet-200/45'
            }`}
          >
            <span className="text-[9px] uppercase tracking-wider text-violet-300/50">{row.title}</span>
            <p className="mt-1 break-all leading-relaxed">{row.text}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
