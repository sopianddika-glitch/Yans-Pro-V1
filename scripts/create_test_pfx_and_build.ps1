param(
    [string]$Password = "testpassword"
)

# This script creates a self-signed code-signing certificate, exports it
# to build\test-cert.pfx, sets environment variables for electron-builder,
# then runs a full build. The generated PFX is for local testing only and
# is not trusted by Windows for distribution.

Write-Output "Creating build directory..."
New-Item -ItemType Directory -Path .\build -Force | Out-Null

Write-Output "Generating self-signed code signing certificate (local test)..."
$cert = New-SelfSignedCertificate -Type CodeSigningCert -DnsName "YansAppTestCert" -CertStoreLocation "Cert:\CurrentUser\My"
if (-not $cert) { Write-Error "Failed to create certificate."; exit 1 }
$thumb = $cert.Thumbprint
$certPath = Join-Path -Path (Get-Location) -ChildPath "build\test-cert.pfx"

Write-Output "Exporting PFX to $certPath"
$securePwd = ConvertTo-SecureString $Password -AsPlainText -Force
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$thumb" -FilePath $certPath -Password $securePwd -Force

Write-Output "Setting environment variables and running build (signed with test PFX)."
$Env:CSC_LINK = $certPath
$Env:CSC_KEY_PASSWORD = $Password

npm ci
npm run build

Write-Output "Build finished. Artifacts are in the dist/ folder. Reminder: test cert is not trusted by Windows SmartScreen."
