# Uploads every public/images/category-*.png into the Supabase Storage `images`
# bucket under `categories/`, named by slug (category-vegetables.png ->
# categories/vegetables.png). Upsert on, so it's safe to re-run.
#
# Run from a network that can reach *.supabase.co (this machine with a VPN on).
# Reads the service-role key from .env.local.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\upload-category-images.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# --- config (pulled from .env.local) -----------------------------------------
$envFile = Join-Path $root '.env.local'
$envMap = @{}
foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') {
        $envMap[$Matches[1]] = $Matches[2].Trim()
    }
}

$supabaseUrl = $envMap['NEXT_PUBLIC_SUPABASE_URL']
$secretKey   = $envMap['SUPABASE_SECRET_KEY']
$bucket      = if ($envMap['SUPABASE_IMAGES_BUCKET']) { $envMap['SUPABASE_IMAGES_BUCKET'] } else { 'images' }

if (-not $supabaseUrl -or -not $secretKey) {
    Write-Error 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local'
    exit 1
}

Write-Host "Uploading category icons to $supabaseUrl  (bucket: $bucket)"

$headers = @{
    Authorization = "Bearer $secretKey"
    apikey        = $secretKey
    'x-upsert'    = 'true'
}

$failed = 0
Get-ChildItem 'public\images\category-*.png' | ForEach-Object {
    $slug = $_.BaseName -replace '^category-', ''
    $dest = "categories/$slug.png"
    $uri  = "$supabaseUrl/storage/v1/object/$bucket/$dest"
    try {
        Invoke-WebRequest -Uri $uri -Method Post -Headers $headers `
            -ContentType 'image/png' -InFile $_.FullName -UseBasicParsing | Out-Null
        Write-Host "  ok   $dest"
    } catch {
        $failed++
        Write-Host "  FAIL $dest  ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host "Done. Public URL pattern:"
Write-Host "  $supabaseUrl/storage/v1/object/public/$bucket/categories/<slug>.png"
if ($failed -gt 0) { exit 1 }
