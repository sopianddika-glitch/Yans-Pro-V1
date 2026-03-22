param(
    [Parameter(Mandatory=$true)][string]$PfxPath,
    [Parameter(Mandatory=$true)][string]$PfxPassword,
    [string]$SecretNameBase = "PFX",
    [string]$Repo = "",
    [switch]$Force
)

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install GitHub CLI: https://cli.github.com/"
    exit 1
}

if (-not (Test-Path $PfxPath)) {
    Write-Error "PFX file not found: $PfxPath"
    exit 1
}

$repoArg = ""
if ($Repo -ne "") { $repoArg = "--repo $Repo" }

if (-not $Force) {
    $confirm = Read-Host "About to set secrets '${SecretNameBase}_BASE64' and '${SecretNameBase}_PASSWORD' in repository '$Repo' (or current repo if empty). Proceed? (y/n)"
    if ($confirm.ToLower() -ne 'y') { Write-Output "Aborted by user."; exit 2 }
}

Write-Output "Creating base64 payload from $PfxPath..."
try {
    $bytes = [System.IO.File]::ReadAllBytes($PfxPath)
    $b64 = [Convert]::ToBase64String($bytes)
} catch {
    Write-Error "Failed to read or encode PFX: $_"
    exit 1
}

Write-Output "Setting GitHub secret '${SecretNameBase}_BASE64'..."
if ($repoArg -ne "") { gh secret set "${SecretNameBase}_BASE64" --body $b64 --repo $Repo } else { gh secret set "${SecretNameBase}_BASE64" --body $b64 }

Write-Output "Setting GitHub secret '${SecretNameBase}_PASSWORD'..."
if ($repoArg -ne "") { gh secret set "${SecretNameBase}_PASSWORD" --body $PfxPassword --repo $Repo } else { gh secret set "${SecretNameBase}_PASSWORD" --body $PfxPassword }

Write-Output "Done. Secrets set in the target repository."

Write-Output "Notes:"
Write-Output "- Ensure you run this from a cloned repo where you have permission to set secrets, or pass --repo 'owner/repo'."
Write-Output "- For organization secrets or different repo, pass the target repo via -Repo 'owner/repo'."
