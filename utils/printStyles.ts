export const PRINT_DOCUMENT_STYLES = `
  :root {
    color-scheme: light;
    font-family: "Segoe UI", Inter, system-ui, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 32px;
    background: #ffffff;
    color: #111827;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-shell {
    max-width: 1024px;
    margin: 0 auto;
  }

  .print-header {
    border-bottom: 2px solid #d1d5db;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .print-header h1,
  .print-shell h1,
  .print-shell h2,
  .print-shell h3,
  .print-shell h4,
  .print-shell p {
    margin: 0;
  }

  .print-shell table {
    width: 100%;
    border-collapse: collapse;
  }

  .print-shell th,
  .print-shell td {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }

  .print-shell th {
    text-align: left;
    background: #f9fafb;
    color: #4b5563;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .print-shell button {
    display: none !important;
  }

  .print-shell .grid {
    display: grid;
  }

  .print-shell .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .print-shell .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .print-shell .grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .print-shell .gap-4 {
    gap: 16px;
  }

  .print-shell .gap-6 {
    gap: 24px;
  }

  .print-shell .gap-8 {
    gap: 32px;
  }

  .print-shell .flex {
    display: flex;
  }

  .print-shell .justify-between {
    justify-content: space-between;
  }

  .print-shell .justify-end {
    justify-content: flex-end;
  }

  .print-shell .items-center {
    align-items: center;
  }

  .print-shell .w-full {
    width: 100%;
  }

  .print-shell .max-w-xs {
    max-width: 320px;
  }

  .print-shell .rounded-lg,
  .print-shell .rounded-xl {
    border-radius: 12px;
  }

  .print-shell .border,
  .print-shell .border-t,
  .print-shell .border-b,
  .print-shell .border-b-2 {
    border-color: #e5e7eb;
  }

  .print-shell .border,
  .print-shell .border-t,
  .print-shell .border-b {
    border-style: solid;
    border-width: 1px;
  }

  .print-shell .border-b-2 {
    border-style: solid;
    border-bottom-width: 2px;
  }

  .print-shell .border-t {
    border-width: 0;
    border-top-width: 1px;
  }

  .print-shell .border-b {
    border-width: 0;
    border-bottom-width: 1px;
  }

  .print-shell .p-4 {
    padding: 16px;
  }

  .print-shell .p-8 {
    padding: 32px;
  }

  .print-shell .px-4 {
    padding-left: 16px;
    padding-right: 16px;
  }

  .print-shell .py-3 {
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .print-shell .py-4 {
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .print-shell .pb-2 {
    padding-bottom: 8px;
  }

  .print-shell .pb-8 {
    padding-bottom: 32px;
  }

  .print-shell .pt-2 {
    padding-top: 8px;
  }

  .print-shell .pt-8 {
    padding-top: 32px;
  }

  .print-shell .mt-1 {
    margin-top: 4px;
  }

  .print-shell .mt-2 {
    margin-top: 8px;
  }

  .print-shell .mt-4 {
    margin-top: 16px;
  }

  .print-shell .mt-12 {
    margin-top: 48px;
  }

  .print-shell .mb-2 {
    margin-bottom: 8px;
  }

  .print-shell .mb-4 {
    margin-bottom: 16px;
  }

  .print-shell .mb-12 {
    margin-bottom: 48px;
  }

  .print-shell .space-y-1 > * + * {
    margin-top: 4px;
  }

  .print-shell .space-y-2 > * + * {
    margin-top: 8px;
  }

  .print-shell .space-y-3 > * + * {
    margin-top: 12px;
  }

  .print-shell .text-left {
    text-align: left;
  }

  .print-shell .text-right {
    text-align: right;
  }

  .print-shell .text-center {
    text-align: center;
  }

  .print-shell .text-xs {
    font-size: 12px;
  }

  .print-shell .text-sm {
    font-size: 14px;
  }

  .print-shell .text-lg {
    font-size: 18px;
  }

  .print-shell .text-xl {
    font-size: 20px;
  }

  .print-shell .text-2xl {
    font-size: 24px;
  }

  .print-shell .text-3xl {
    font-size: 30px;
  }

  .print-shell .text-4xl {
    font-size: 36px;
  }

  .print-shell .font-medium {
    font-weight: 500;
  }

  .print-shell .font-semibold {
    font-weight: 600;
  }

  .print-shell .font-bold {
    font-weight: 700;
  }

  .print-shell .font-mono {
    font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
  }

  .print-shell .uppercase {
    text-transform: uppercase;
  }

  .print-shell .tracking-wider {
    letter-spacing: 0.08em;
  }

  .print-shell .bg-white {
    background: #ffffff;
  }

  .print-shell .bg-gray-50 {
    background: #f9fafb;
  }

  .print-shell .bg-gray-100 {
    background: #f3f4f6;
  }

  .print-shell .text-gray-400 {
    color: #9ca3af;
  }

  .print-shell .text-gray-500 {
    color: #6b7280;
  }

  .print-shell .text-gray-600 {
    color: #4b5563;
  }

  .print-shell .text-gray-700 {
    color: #374151;
  }

  .print-shell .text-gray-800 {
    color: #1f2937;
  }

  .print-shell .text-gray-900 {
    color: #111827;
  }

  .print-shell .text-green-600,
  .print-shell .text-brand-green {
    color: #2da44e;
  }

  .print-shell .text-red-600,
  .print-shell .text-brand-red {
    color: #e5534b;
  }

  @media print {
    body {
      padding: 0;
    }
  }
`;
