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
    $out = & $gh auth status 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return ($code -eq 0)
}

Write-Host "== GitHub auth =="
if (-not (Test-GhAuth)) {
    Write-Host ""
    Write-Host "Not logged in yet. A browser window will open."
    Write-Host "Log into GitHub, then come back here."
    Write-Host ""
    # Prefer device/web login; do not treat stderr as fatal
    $ErrorActionPreference = "Continue"
    & $gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Login failed or was cancelled. Run this again and finish the browser login."
        exit 1
    }
    if (-not (Test-GhAuth)) {
        Write-Host "Still not logged in after auth login. Try:"
        Write-Host "  & `"$gh`" auth login --web"
        exit 1
    }
}
Write-Host "GitHub CLI is logged in."

$user = ""
$ErrorActionPreference = "SilentlyContinue"
$user = (& $gh api user --jq .login 2>$null)
$ErrorActionPreference = "Continue"
if ($user) { $user = $user.ToString().Trim() }
if ([string]::IsNullOrWhiteSpace($user)) {
    Write-Host "Could not read GitHub username"
    exit 1
}
Write-Host "Logged in as: $user"

# Ensure git repo
if (-not (Test-Path -LiteralPath ".git")) {
    git init -b main
    git config user.email "chasincoverage@gmail.com"
    git config user.name "Chase Tabor"
}

# Stage and commit if needed
git add -A
$pending = git status --porcelain
if ($pending) {
    git commit -m "Deploy Chasin Coverage site 2 to GitHub Pages"
} else {
    Write-Host "Nothing new to commit."
}

Write-Host "== Ensure repo $user/$RepoName =="
$ErrorActionPreference = "SilentlyContinue"
& $gh repo view "$user/$RepoName" 2>$null | Out-Null
$exists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = "Continue"

if (-not $exists) {
    Write-Host "Creating public repo..."
    & $gh repo create $RepoName --public --source=. --remote=origin --push --description "Chasin Coverage free GitHub Pages site"
    if ($LASTEXITCODE -ne 0) {
        & $gh repo create $RepoName --public --description "Chasin Coverage free GitHub Pages site"
        git remote remove origin 2>$null
        git remote add origin "https://github.com/$user/$RepoName.git"
        git branch -M main
        git push -u origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Push failed."
            exit 1
        }
    }
} else {
    Write-Host "Repo already exists - pushing this folder as main..."
    $url = "https://github.com/$user/$RepoName.git"
    $cur = git remote get-url origin 2>$null
    if (-not $cur) {
        git remote add origin $url
    } else {
        git remote set-url origin $url
    }
    git branch -M main
    git push -u origin main --force
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed."
        exit 1
    }
}

Write-Host "== Enable GitHub Pages (Actions) =="
$ErrorActionPreference = "SilentlyContinue"
& $gh api -X POST "repos/$user/$RepoName/pages" -f build_type=workflow 2>$null | Out-Null
& $gh api -X PUT "repos/$user/$RepoName/pages" -f build_type=workflow 2>$null | Out-Null
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================"
Write-Host " DONE - using: chasin-coverage-website 2"
Write-Host " Repo:  https://github.com/$user/$RepoName"
Write-Host " Site:  https://$user.github.io/$RepoName/"
Write-Host " Wait 1-3 min (videos make first deploy slower)."
Write-Host " Actions: https://github.com/$user/$RepoName/actions"
Write-Host "========================================"
