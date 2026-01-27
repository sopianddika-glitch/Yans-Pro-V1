# CI Code Signing (Windows) — Detailed Steps

This document explains how to prepare a code signing certificate (PFX), add it to GitHub Secrets, and how the repository workflow uses it to sign Windows installers.

## 1. Obtain a code signing certificate

- For production distribution, purchase a certificate from a CA (DigiCert, Sectigo, GlobalSign, etc.). EV (Extended Validation) certificates reduce SmartScreen warnings.
- For testing/local use you can create a self-signed PFX (not trusted by Windows): see `scripts/create_test_pfx_and_build.ps1`.

## 2. Export a PFX from Windows Certificate Manager (if you already have a cert)

1. Open `certmgr.msc` or `mmc.exe` → Add Snap-in `Certificates` (Current User or Local Machine as appropriate).
2. Find your code signing certificate under `Personal` → `Certificates`.
3. Right-click → `All Tasks` → `Export...` → choose `Yes, export the private key` and PFX format. Set a strong password and save `your-cert.pfx` locally.

PowerShell example to export a certificate to PFX by thumbprint (replace THUMBPRINT_HERE):
```powershell
$thumb = 'THUMBPRINT_HERE'
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$thumb" -FilePath .\your-cert.pfx -Password (ConvertTo-SecureString -String 'PFX_PASS' -AsPlainText -Force)
```

## 3. Create the `PFX_BASE64` payload for GitHub Secrets

Windows (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\your-cert.pfx')) | Out-File -Encoding ascii cert.b64
Get-Content cert.b64 -Raw | Set-Clipboard   # optional: copy to clipboard
```

macOS / Linux:

```bash
base64 -w 0 your-cert.pfx > cert.b64
cat cert.b64 | pbcopy   # macOS optional
```

## 4. Add secrets to GitHub

Via `gh` CLI (example):
```powershell
gh secret set PFX_BASE64 --body (Get-Content cert.b64 -Raw)
gh secret set PFX_PASSWORD --body 'your-pfx-password'
```

Or use the repository Settings → Secrets → Actions UI to create `PFX_BASE64` and `PFX_PASSWORD`.

## 5. How the workflow uses the secrets

- The workflow at `.github/workflows/build-and-release-windows.yml` will:
  - Restore the PFX file from `PFX_BASE64` into `build/release-cert.pfx`.
  - Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables for `electron-builder`.
  - Run `npm ci` and `npm run build` which invokes `electron-builder` to produce signed installers.

Notes:
- The CI runner must have access to `signtool.exe` for some signing steps; `windows-latest` typically provides the Windows SDK.
- If you don't provide `PFX_BASE64`, the workflow will still build unsigned artifacts (useful for PR checks or internal testing).

## 6. Testing locally

- Use the included script to create a self-signed PFX and run a signed build locally:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create_test_pfx_and_build.ps1
```

## 7. Security recommendations

- Never commit `.pfx` files or `cert.b64` to source control.
- Restrict repository secret access and prefer organization-level secrets or a dedicated secure vault for production certificates.
- Rotate and revoke certificates if they are exposed.

## 8. Troubleshooting

- If electron-builder cannot find a certificate, ensure the workflow environment sets `CSC_LINK` and `CSC_KEY_PASSWORD` (our workflow writes these from the restored PFX and the `PFX_PASSWORD` secret).
- For SmartScreen/Windows Defender warnings, use an EV code signing certificate and ensure the signer reputation is established.
