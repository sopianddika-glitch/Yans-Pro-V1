# Signing Instructions (EXE / MSI)

This file documents how to sign the built artifacts produced by `electron-builder`.

Prerequisites
- You must have a code signing certificate (PFX) and its password.
- `signtool.exe` (Windows SDK) must be on PATH.

1) Sign installers locally (PowerShell)

Sign an NSIS EXE:
```powershell
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a /f "C:\secrets\codesign.pfx" /p "PFX_PASSWORD" "C:\path\to\dist\YansApp Setup 1.0.0.exe"
```

Sign an MSI:
```powershell
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a /f "C:\secrets\codesign.pfx" /p "PFX_PASSWORD" "C:\path\to\dist\YansApp 1.0.0.msi"
```

Notes:
- `/fd SHA256` forces SHA-256 digest (recommended).
- `/tr` uses RFC3161 timestamping (preferred over `/t`).
- `/a` auto-selects the best cert in the file.

2) Verify signatures

```powershell
signtool verify /pa /v "C:\path\to\dist\YansApp Setup 1.0.0.exe"
signtool verify /pa /v "C:\path\to\dist\YansApp 1.0.0.msi"
```

3) electron-builder automatic signing (local config)

In `electron-builder.yml` or `package.json` config for electron-builder, add:

```yaml
win:
  target:
    - nsis
    - msi
  certificateFile: C:\secrets\codesign.pfx
  certificatePassword: ${env:CSC_KEY_PASSWORD}
```

For local builds, set the `CSC_KEY_PASSWORD` environment variable before running `npm run build`.

4) CI signing (GitHub Actions example)

- Store the PFX as a GitHub secret (Base64 encoded) as `CSC_BASE64_PFX` and the PFX password as `CSC_PASSWORD`.
- Example job snippet (Windows runner):

```yaml
- name: Restore PFX
  run: |
    echo "${{ secrets.CSC_BASE64_PFX }}" > codesign.pfx.b64
    certutil -decode codesign.pfx.b64 codesign.pfx
- name: Build & Sign
  env:
    CSC_LINK: ${{ github.workspace }}\codesign.pfx
    CSC_KEY_PASSWORD: ${{ secrets.CSC_PASSWORD }}
  run: npm run build
```

5) EV vs Standard certs
- EV certs give better SmartScreen reputation but often require hardware/token and different handling in CI.

6) Security
- Never commit PFX to the repository. Use secret stores (GitHub Secrets, Azure KeyVault, etc.).
- Remove the decoded PFX from CI runner after use if you write it to disk.

7) Troubleshooting
- If `signtool` not found: install Windows SDK and add the `bin` path to `PATH`.
- Timestamp server errors: try alternate servers (e.g., `http://timestamp.sectigo.com`).
- If electron-builder cannot find cert: ensure `CSC_LINK` points to a valid file path or URL accessible in CI.

----
Generated: 2025-12-13
