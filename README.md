# Yans Pro - AI-Powered Finance Tracker

Yans Pro is a modern Progressive Web App (PWA) for professional finance tracking. It combines transaction management, invoicing, budgeting, product management, and AI-assisted insights in one business-ready interface.

Built with React, TypeScript, Vite, and Tailwind's CDN runtime configuration, the project is designed to run locally, build cleanly, and deploy reliably to GitHub Pages.

## Features

- **Dashboard:** Get a quick operational snapshot of revenue, expenses, forecasts, budgets, and recurring activity.
- **Transaction Management:** Add, edit, filter, export, restore, and review audit history for transactions.
- **AI-Powered Insights:** Use Gemini-driven analysis for financial summaries, reminders, and market suggestions.
- **AI Receipt Scanning:** Extract transaction details from receipt uploads.
- **Budgeting:** Plan and monitor spending by category with clear status indicators.
- **Invoicing:** Create, edit, and manage invoices and invoice items.
- **Products and POS:** Track products, pricing, stock, and point-of-sale flows.
- **Multi-Profile Support:** Manage multiple business profiles with separate settings and data.
- **Desktop Packaging:** Ship the app as an Electron desktop application when needed.

## Prerequisites

Install [Node.js](https://nodejs.org/) 20 or newer so `npm` is available.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Run a full type-check:

```bash
npm run typecheck
```

Create a normal production build:

```bash
npm run build
```

## GitHub Pages Deployment

This repository now supports two deployment paths so the site can still render even if the repository is currently using GitHub Pages' older branch-based mode:

1. **Primary deployment:** [deploy-pages.yml](./.github/workflows/deploy-pages.yml) builds and deploys the production app for GitHub Pages using GitHub Actions.
2. **Compatibility fallback:** the committed `docs/` directory contains a static Pages build, and the source [index.html](./index.html) automatically redirects GitHub Pages legacy branch traffic to that fallback.

Build the GitHub Pages artifact locally:

```bash
npm run build:pages
```

Build and refresh the fallback `docs/` site:

```bash
npm run build:docs
```

## Recent Deployment Fixes

- Restored a valid GitHub Pages workflow and simplified the build pipeline.
- Added a `docs/` fallback build so the published site is not blank when GitHub Pages still serves repository files directly.
- Corrected the app entry HTML, deployment metadata, and service worker registration for repository subpaths.
- Fixed TypeScript project discovery so editor and CI type-checking cover the real source files.
- Cleaned project documentation and deployment instructions so the repository is easier to maintain.

## Desktop Packaging

You can also package the project as a Windows desktop application.

Build the Electron installer:

```bash
npm run electron:dist
```

After packaging completes, Electron build output will be available in the generated distribution artifacts from `electron-builder`.
