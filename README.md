# DNS Resolver Live

A real time DNS resolution dashboard that shows you exactly how domain name lookups work under the hood. Type in any domain, and watch as the query travels through root servers, TLD servers, and authoritative nameservers, all visualized step by step with live data from Cloudflare and Google DNS over HTTPS.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

## What It Does

This tool performs actual DNS lookups using DNS over HTTPS (DoH) and breaks the entire process down into individual steps so you can see what happens at every stage of a DNS resolution.

**Resolution Modes**
- Recursive: the local resolver handles everything on behalf of the client
- Iterative: the local resolver queries each server one at a time and follows referrals

**Live Records**
- A records (IPv4 addresses)
- NS records (nameservers)
- MX records (mail exchangers)

**Interactive Topology**
- Visual diagram showing all five nodes: Client Host, Local DNS, Root, TLD, and Authoritative
- Animated edges that light up as queries and responses flow between servers
- Color coded arrows for queries, referrals, and answers

**Packet Inspector**
- Shows the DNS message header fields (ID, flags, counts) in the standard RFC 1035 layout
- Updates live as the resolution progresses from query to reply

**Resolution Trace**
- Timestamped log of every step in the lookup
- Copy the full trace to clipboard for documentation or assignments

**Local Cache**
- Stores up to 5 recent lookups with TTL display
- Option to bypass cache and force a fresh DoH lookup

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 18 with TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3.4 |
| Animations | Framer Motion |
| DNS Queries | Cloudflare DoH (primary), Google DoH (fallback) |
| Testing | Vitest with jsdom |

## Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/Gustav1814/dns-resolver-live.git
cd dns-resolver-live
npm install
```

Start the dev server:

```bash
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173) and start resolving domains.

## Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Type check and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run build:preview` | Build and preview in one step |
| `npm run lint` | Run TypeScript type checking |
| `npm run test` | Run unit tests |

## Environment Variables

You can optionally override the DoH endpoints by creating a `.env` file (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `VITE_DOH_CLOUDFLARE_URL` | Custom Cloudflare DoH endpoint. Use `{name}` and `{type}` as placeholders |
| `VITE_DOH_GOOGLE_URL` | Custom Google DoH endpoint. Use `{name}` and `{type}` as placeholders |

## Project Structure

```
src/
├── components/         UI components (search bar, topology, logs, cache, etc.)
├── hooks/              useDnsResolution custom hook (core resolution logic)
├── lib/                DNS queries, topology math, report formatting
├── App.tsx             Main app layout with tab navigation
├── main.tsx            Entry point with error boundary
└── index.css           Global styles and glass effects
```

## How It Works

1. You enter a domain and click Resolve
2. The app sends real DNS over HTTPS queries to Cloudflare (with Google as fallback)
3. Each step of the resolution is animated on the topology diagram
4. A records, NS records, and MX records are fetched and displayed
5. The full DNS message header is shown in the packet inspector
6. Results are cached locally for quick re lookups

No backend server needed. Everything runs in the browser using public DoH APIs.

## License

MIT
