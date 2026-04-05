import { motion, AnimatePresence } from 'framer-motion'

export function StepNarrative({ html }: { html: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={html.slice(0, 40)}
        className="glass-subtle relative overflow-hidden rounded-2xl pl-5 pr-5 py-4 font-mono text-[12px] leading-relaxed text-violet-100/85 [&_strong]:font-semibold [&_strong]:text-cyan-200"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b from-cyan-400 via-violet-400 to-fuchsia-500 shadow-[0_0_12px_rgba(167,139,250,0.5)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-500/15 to-transparent blur-2xl"
          aria-hidden
        />
        <div className="relative z-10 pl-1" dangerouslySetInnerHTML={{ __html: html }} />
      </motion.div>
    </AnimatePresence>
  )
}
