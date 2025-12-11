
# Yans Pro - AI-Powered Finance Tracker

Yans Pro is a modern, responsive Progressive Web App (PWA) for professional business finance tracking. It leverages AI-powered insights to help you manage your revenue, expenses, and profitability with ease.

Built with React, TypeScript, and Tailwind CSS, it offers a clean, intuitive interface and powerful features.

## Features

-   **Dashboard:** Get a comprehensive overview of your financial health at a glance.
-   **Transaction Management:** Easily add, track, and categorize income and expenses.
-   **AI-Powered Insights:** Use Gemini to analyze your financial data and get actionable advice.
-   **AI Receipt Scanning:** Automatically extract transaction details by uploading a receipt image.
-   **Budgeting:** Set and track budgets for different expense categories.
-   **Invoicing:** Create and manage client invoices.
-   **Multi-Profile Support:** Manage finances for multiple businesses seamlessly.
-   **Desktop Application:** Packaged with Electron for a native desktop experience.

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
npm start
```

This will launch the app in a new window with developer tools accessible.

---

## Building a Desktop Application (.exe)

You can build a distributable installer for Windows (`.exe`).

### 1. Run the Build Script

From the project's root directory, execute the following command:

```bash
npm run dist
```

This command uses `electron-builder` to package your application into an installer.

### 2. Locate the Installer

Once the process is complete, you will find a `dist` folder in your project directory. Inside, there will be a file named `Yans Pro Setup X.Y.Z.exe` (where X.Y.Z is the version number).

This `.exe` file is the installer for your application. You can run it on any Windows computer to install Yans Pro.
