# AfterFlow — Post-Event Productivity & Networking Platform

[![React](https://img.shields.io/badge/React-19-00D995?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-00D995?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-00D995?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-00D995?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**AfterFlow** transforms post-event momentum into actionable follow-through. Capture notes, turn takeaways into tasks, and maintain connections with a modern, WhatsApp/Instagram-inspired messaging workspace built with a dark emerald-green aesthetic.

---

## ✨ Features

- **Direct Chat & Connections Workspace**: 3-panel messaging interface (Conversations List, Active Chat Stream with typing indicators, and CRM Follow-Up Context Panel) with simulated real-time replies and localStorage persistence.
- **Collapsible Left Sidebar**: Hideable navigation on desktop (`Ctrl+B` or topbar toggle) that automatically expands the workspace to 100% width, plus a mobile overlay drawer with backdrop.
- **Smart Capture & Notes**: Fast meeting summaries, audio/transcript imports, key takeaways extraction, and instant sync from chat transcripts.
- **Action Board**: Kanban-style follow-up task management with priority tags, due dates, and overdue alerts.
- **Event Hub**: Centralized timeline for tech summits, conferences, and meetups.
- **Neon Border Hover Effects**: Interactive per-card emerald glow on dashboard widgets, upcoming events, and contact cards.
- **Fully Responsive**: Optimized across small mobile (320px–390px), tablet (768px–1024px), and desktop (1280px–1440px+).

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 8
- **State Management**: Zustand with persistent storage
- **Styling**: Vanilla CSS custom design system + Tailwind CSS
- **Iconography**: Lucide React + Phosphor Icons
- **Fonts**: Outfit + Inter

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/shivamgadakh-1907/After-flow.git

# Navigate into project directory
cd After-flow

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The production bundle will be generated in the `dist/` directory.

---

## 📄 License

MIT © [Shivam Gadakh](https://github.com/shivamgadakh-1907)
