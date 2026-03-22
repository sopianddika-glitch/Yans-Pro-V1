# Yans Pro - AI-Powered Finance Tracker

Yans Pro is a modern, responsive Progressive Web App (PWA) for professional business finance tracking. It leverages AI-powered insights to help you manage your revenue, expenses, and profitability with ease.

Built with React, TypeScript, and Tailwind CSS, it offers a clean, intuitive interface and powerful features.

## Features

- **Dashboard:** Get a comprehensive overview of your financial health at a glance.
- **Transaction Management:** Easily add, track, and categorize income and expenses.
- **AI-Powered Insights:** Use Gemini to analyze your financial data and get actionable advice.
- **AI Receipt Scanning:** Automatically extract transaction details by uploading a receipt image.
- **Budgeting:** Set and track budgets for different expense categories.
- **Invoicing:** Create and manage client invoices.
- **Multi-Profile Support:** Manage finances for multiple businesses seamlessly.
- **Desktop Application:** Packaged with Electron for a native desktop experience.

## Prerequisites

To run this project, you will need [Node.js](https://nodejs.org/) installed on your machine. This gives you access to `npm`.

## Running the Application

### 1. Install Dependencies

First, open a terminal in the project's root directory and install the necessary dependencies:

```bash
npm install
```

### 2. Run in Development Mode

To start the application in a development window, run:

```bash
npm run dev
```

This will launch the app in a new window with developer tools accessible.

---

## Building a Desktop Application (.exe)

You can build a distributable installer for Windows (`.exe`).

### 1. Run the Build Script

From the project's root directory, execute the following command:

```bash
npm run build:app
```

This command uses `electron-builder` to package your application into an installer.

### 2. Locate the Installer

Once the process is complete, you will find a `dist` folder in your project directory. Inside, there will be a file named `Yans Pro Setup X.Y.Z.exe` (where X.Y.Z is the version number).

This `.exe` file is the installer for your application. You can run it on any Windows computer to install Yans Pro.

---

## CI: Code signing for Windows (GitHub Actions)

This project includes a Windows build workflow at `.github/workflows/build-and-release-windows.yml`.
To sign builds in CI you must provide your code signing PFX and password as GitHub Secrets.

Required secrets

- `PFX_BASE64` — the base64-encoded contents of your `.pfx` file.
- `PFX_PASSWORD` — the password for the PFX.

How to create `PFX_BASE64` (PowerShell on Windows)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\your-cert.pfx')) | Out-File -Encoding ascii cert.b64
Get-Content cert.b64 -Raw | Set-Clipboard            # copy to clipboard (optional)
```

Or on macOS / Linux

```bash
base64 -w 0 your-cert.pfx > cert.b64
cat cert.b64 | pbcopy   # macOS (optional)
```

Add secrets to GitHub (via web UI or `gh` CLI)
PowerShell (Windows) example using `gh`:

```powershell
gh secret set PFX_BASE64 --body (Get-Content cert.b64 -Raw)
gh secret set PFX_PASSWORD --body 'your-pfx-password'
```

Using `gh` on macOS/Linux:

```bash
gh secret set PFX_BASE64 --body "$(cat cert.b64)"
gh secret set PFX_PASSWORD --body "your-pfx-password"
```

Triggering a release build

- Create a tag and push it to GitHub (the workflow runs on tags matching `v*`):

```bash
git tag v1.0.0
git push origin v1.0.0
```

Security notes

- Never commit the `.pfx` or the base64 file into the repository.
- Limit access to repository secrets and use an organization secret or a secure key vault for production.
- For public distribution, obtain a CA-issued code signing cert (EV recommended) to reduce SmartScreen warnings.

If you want, I can add a short `docs/` page or a GitHub Actions example that runs on PRs too.
