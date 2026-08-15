# Textile Shop Management System

> **A modern, offline-first Windows POS & Retail Management System built with React, TypeScript, Vite, Electron, Tailwind CSS, and SQLite.**

---

## 📖 Project Overview

The **Textile Shop Management System** is a Windows desktop application designed to streamline retail operations for textile shops, clothing stores, and fabric outlets. It combines Point of Sale (POS) billing, product variants (Size/Color/SKU), inventory management, customer ledgers, supplier purchases, returns/exchanges, financial reporting, and local database backup into a unified desktop software.

---

## 🏆 Final Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React.js (v18) | Modern component-based user interface |
| **Language** | TypeScript (v5) | Strict static type system across renderer & main process |
| **Desktop Runtime**| Electron (v34) | Cross-platform desktop window execution & OS integration |
| **Bundler & Dev** | Vite (v6) | Instant HMR development server & fast production builds |
| **Styling** | Tailwind CSS (v3) | Utility-first responsive design system |
| **Local Database** | SQLite (`better-sqlite3`) | High-performance local database storing data in `%APPDATA%` |
| **Charts** | Recharts | Interactive inventory & sales trend analytics |
| **Packaging** | Electron Builder | Packaging into standalone Windows binaries & NSIS installer |

---

## 🏗️ Architecture & Security Model

```text
┌─────────────────────────────────────────────────────────┐
│              TEXTILE SHOP MANAGEMENT SYSTEM             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│        React + TypeScript UI (Renderer Process)         │
│                            │                            │
│                  Safe contextBridge API                 │
│                            ▼                            │
│                 Preload Bridge Layer                    │
│                            │                            │
│                   Type-Safe IPC                         │
│                            ▼                            │
│             Electron Main Process Service               │
│                            │                            │
│                            ▼                            │
│                  better-sqlite3 Engine                  │
│                            │                            │
│                            ▼                            │
│        %APPDATA%/textile-shop-management-system/        │
│                    textile-shop.db                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Backup │ SQLite Migrations │ Logging │ Windows Installer│
└─────────────────────────────────────────────────────────┘
```

### Security Principles:
- **Context Isolation Enabled**: `contextIsolation: true` prevents renderer process from modifying Node primitives.
- **Node Integration Disabled**: `nodeIntegration: false` blocks direct OS access from the UI.
- **Strict Data Preservation**: Business database (`textile-shop.db`) is stored safely in `%APPDATA%/textile-shop-management-system/textile-shop.db`, ensuring database files persist across software updates.

---

## 📁 Folder Structure

```text
TextileSoftware/
├── electron/
│   ├── main/
│   │   ├── database/       # SQLite database connection & auto-migrations
│   │   ├── ipc/            # IPC request handlers (app, db, settings, logging)
│   │   ├── index.ts        # Electron main window lifecycle entry
│   │   └── logger.ts       # File logging service (%APPDATA%/logs/app.log)
│   └── preload/
│       └── index.ts        # Typed contextBridge window.api layer
├── src/
│   ├── app/                # HashRouter route configuration
│   ├── components/
│   │   ├── layout/         # AppShell, Header, Sidebar
│   │   └── ui/             # Design System (Button, Input, Card, Modal, Table, Badge, etc.)
│   ├── features/           # Modular business features (dashboard, pos, inventory, etc.)
│   ├── styles/             # Tailwind CSS & canvas grid directives
│   ├── types/              # TypeScript global definitions
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── unit/               # Automated Vitest unit tests
├── electron-builder.yml    # NSIS Windows packaging configuration
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.30.0 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/nnithyanandam024/textile-shop-management-system.git
cd textile-shop-management-system

# 2. Install dependencies
npm install

# 3. Start development server & Electron window
npm run dev
```

---

## 🛠️ Development & Quality Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launch Vite dev server and Electron desktop window |
| `npm run build` | Compile TypeScript and bundle production renderer/electron files |
| `npm run test` | Run automated Vitest unit tests |
| `npm run lint` | Execute ESLint code quality & type safety check |
| `npm run package:win` | Package Windows executable & NSIS installer into `release/` |

---

## 📄 License & Ownership

Developed for **Textile Shop Management System**. Proprietary and confidential.