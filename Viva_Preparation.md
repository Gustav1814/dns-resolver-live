# DNS Real-time Visualizer – Viva Preparation Guide

This document explains the entire codebase logically so you can answer any questions during your Viva examination.

## 1. Project Goal & Overview
This application is an **Educational DNS Visualization Tool**. Its primary goal is to teach how Domain Name System (DNS) resolution works behind the scenes. 
Unlike typical animations, it uses **real live data** by fetching DNS records of the domains you enter using **DNS-over-HTTPS (DoH)**. It visually steps through the query process, distinguishing between **Recursive** and **Iterative** resolutions, maintaining a mock cache, and logging individual query stages.

## 2. System Architecture
- **Frontend SPA (Single Page Application):** The entire application runs in the browser.
- **No Backend:** To reduce complexity and hosting costs, the app does not have its own backend. Instead, it queries public DoH (DNS-over-HTTPS) APIs (Cloudflare and Google) directly using the browser's standard Fetch API.
- **State-driven UI:** The application's UI rerenders and advances its animations based on a large state machine representing the current step of the DNS resolution.

---

## 3. Core Libraries & Their Usage

| Library | Purpose in this code |
| :--- | :--- |
| **React (`react`, `react-dom`)** | The core UI framework. Used for building modular components (e.g., `TopologyDiagram.tsx`, `DomainSearch.tsx`) and managing the complex state of the DNS simulation via hooks (`useState`, `useCallback`, `useRef`). |
| **Vite** | The build tool and development server. Chosen over Webpack/CRA because it is significantly faster (using native ES modules) and is modern standard. |
| **Framer Motion (`framer-motion`)** | The animation library. It handles things like the smooth glowing lines in the topology diagram, the sliding packet inspector, and fading elements in/out (`AnimatePresence`). Vital for making the visualizer "feel alive". |
| **Tailwind CSS (`tailwindcss`)** | A utility-first CSS framework. Used to rapidly style the UI with modern aesthetics (gradients, dark mode, glassmorphism) directly in the `className` attributes without writing separate CSS files. |
| **TypeScript** | Adds static typing to JavaScript. This defines interfaces (e.g., `DnsRecords`, `MessageState`, `CacheEntry`) guaranteeing the data moving between DoH responses to UI components is predictable, preventing bugs. |

---

## 4. Key Files & Code Walkthrough

### 1. `src/App.tsx`
This is the **Entry Point** of the user interface. 
- It maintains the very simple top-level routing (changing between `Resolve`, `Traces`, `Cache`, `Settings` tabs using a `useState<AppPage>`).
- It extracts state and functions from the main custom hook (`useDnsResolution`) and distributes them as `props` to the child components (like passing the `logs` to `<ResolutionLog>`).

### 2. `src/hooks/useDnsResolution.ts`
This is the **Central Nervous System**. It's a massive React hook containing the business logic of the simulation:
- **State Initialization:** Uses `useState` to track `status` (resolving/idle), `cache`, `logs`, the `topology` graph nodes, and `speedMs` (the simulation speed).
- `runRecursive()` **and** `runIterative()` The most important functions. When you search for a domain, one of these executes. They simulate the DNS process:
  - Updates the `stepDesc` UI text.
  - Artificially pauses using an `await wait(spd)` delay to let the user see the animation.
  - Updates the `topology` edges (e.g., drawing a line from "Local" -> "Root").
  - Asks the network functions (`fetchTLDNS`, `fetchAuthNS`) for the real data.
- **Cache Logic:** Contains `addCache()` which stores the resolution temporarily. It's limited to 5 items (`CACHE_MAX = 5`), kicking out the oldest one when full.

### 3. `src/lib/dns.ts`
This handles the actual **Networking and Protocol Mocking**.
- `doh(name, type)`: **The core network function.** To resolve a domain (like `google.com`), it executes a real HTTP GET request containing `Accept: application/dns-json` to `https://cloudflare-dns.com/dns-query`. If Cloudflare fails or blocks, it falls back to Google's DoH API.
- **Parsing mechanisms:** Functions like `fetchA()`, `fetchMX()`, and `fetchTLDNS()` call `doh()` and parse the JSON response. For example, `fetchA` looks through the JSON `Answer` array for `type === 1` (A) or `type === 28` (AAAA) records to extract the target IP address.
- **Mock Packets:** Functions like `emptyMessage()`, `queryMessage()`, and `replyMessage()` assemble fake DNS Packet shapes (showing Hex flags like `0x0100` for Query, `0x8180` for Reply) so the user can inspect what a real UDP packet would look like.

### 4. Component Folder (`src/components/`)
- `TopologyDiagram.tsx`: Translates the current simulation step into a visual graph. Uses SVGs and Framer Motion to draw lines (edges) and highlight the active servers (Host, Local, Root, TLD, Auth).
- `DomainSearch.tsx`: The input bar. Also handles speed control sliders and the recursive/iterative toggle.
- `DnsRecordsCard.tsx`: After resolution, displays the IP addresses, nameservers, and mail servers elegantly.

---

## 5. Potential Viva Questions & Answers

**Q: Why use DNS-over-HTTPS (DoH) instead of standard DNS (UDP Port 53)?**
*A: Browsers cannot send raw UDP packets for security reasons. Therefore, a purely client-side web application cannot do traditional DNS queries directly. Instead, we use DoH, which wraps the DNS query inside a standard HTTPS GET/POST request that the browser's Fetch API perfectly understands. Plus, DoH provides encryption and prevents intermediate ISP tampering.*

**Q: How do you differentiate Recursive vs Iterative in this app?**
*A: In reality, we just fetch data by sending a query for the domain. However, to teach the concept, the `runRecursive` and `runIterative` functions use artificial logic and delays. Both functions fetch the same data, but `runIterative` visually shows the Local server communicating sequentially with the Root, TLD, and Auth servers independently, whereas `runRecursive` simulates the Root forwarding to TLD, TLD to Auth, etc. (though technically from the browser we just query DoH in both cases).*

**Q: How does the application handle state management?**
*A: Through React's `useState` grouped together logically in a custom hook called `useDnsResolution`. We aren't using Redux or Zustand as the logic is deeply tied to the visual simulation phase, so native hooks combined with multiple state objects (`logs`, `topology`, `message`) perfectly fit our needs.*

**Q: What happens if a domain doesn't exist?**
*A: The `fetchA` or DoH function will throw an error (or return an empty answer array) resulting in the `catch (e)` block triggering in `useDnsResolution.ts`. This immediately turns the UI `status` to 'error', displays an `errorBanner` with the failure message, and aborts the animation.*
