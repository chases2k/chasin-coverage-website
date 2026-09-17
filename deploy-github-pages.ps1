# Deploy Chasin Coverage website 2 to free GitHub Pages
# Run: .\deploy-github-pages.ps1

$ErrorActionPreference = "Continue"
$RepoName = "chasin-coverage-website"
$SiteDir = $PSScriptRoot

$gh = Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) {
    $gh = Join-Path $env:LocalAppData "Programs\GitHub CLI\gh.exe"
}
if (-not (Test-Path $gh)) {
    Write-Host "GitHub CLI not found. Install: winget install GitHub.cli"
    exit 1
}

Set-Location -LiteralPath $SiteDir
Write-Host "== Site folder =="
Write-Host $SiteDir

function Test-GhAuth {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    & $script:gh auth status 2>&1 | Out-Null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return ($code -eq 0)
}

Write-Host "== GitHub auth =="
if (-not (Test-GhAuth)) {
    Write-Host "Not logged in yet. Browser/device login will open."
    & $gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
Write-Host "GitHub CLI is logged in."
& $gh auth setup-git 2>$null

$user = (& $gh api user --jq .login 2>$null)
if ($user) { $user = $user.ToString().Trim() }
if ([string]::IsNullOrWhiteSpace($user)) {
    Write-Host "Could not read GitHub username"
    exit 1
}
Write-Host "Logged in as: $user"

# Git LFS for large hero videos (avoids SSL fail on 100MB push)
git lfs install 2>$null
if (-not (Test-Path ".gitattributes")) {
    git lfs track "*.mp4" 2>$null
}

if (-not (Test-Path -LiteralPath ".git")) {
    git init -b main
    git config user.email "chasincoverage@gmail.com"
    git config user.name "Chase Tabor"
}

git config http.postBuffer 524288000
git config http.version HTTP/1.1

git add -A
$pending = git status --porcelain
if ($pending) {
    git commit -m "Update Chasin Coverage site 2"
} else {
    Write-Host "Nothing new to commit."
}

Write-Host "== Push to $user/$RepoName =="
& $gh repo view "$user/$RepoName" 2>$null | Out-Null
$exists = ($LASTEXITCODE -eq 0)

if (-not $exists) {
    & $gh repo create $RepoName --public --source=. --remote=origin --push --description "Chasin Coverage free GitHub Pages site"
    if ($LASTEXITCODE -ne 0) {
        & $gh repo create $RepoName --public --description "Chasin Coverage free GitHub Pages site"
        git remote remove origin 2>$null
        git remote add origin "https://github.com/$user/$RepoName.git"
        git branch -M main
        git push -u origin main
    }
} else {
    $url = "https://github.com/$user/$RepoName.git"
    $cur = git remote get-url origin 2>$null
    if (-not $cur) { git remote add origin $url } else { git remote set-url origin $url }
    git branch -M main
    git push -u origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed - retrying force..."
        git push -u origin main --force
    }
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host "== Enable GitHub Pages =="
$bodyPath = Join-Path $env:TEMP "gh-pages-enable.json"
Set-Content -Path $bodyPath -Value '{"build_type":"workflow"}' -Encoding ascii
& $gh api -X POST "repos/$user/$RepoName/pages" --input $bodyPath 2>$null | Out-Null
& $gh api -X PUT "repos/$user/$RepoName/pages" --input $bodyPath 2>$null | Out-Null

Write-Host ""
Write-Host "========================================"
Write-Host " DONE - website 2 deployed"
Write-Host " Repo:  https://github.com/$user/$RepoName"
Write-Host " Site:  https://$user.github.io/$RepoName/"
Write-Host " Actions: https://github.com/$user/$RepoName/actions"
Write-Host "========================================"
