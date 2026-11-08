# Remove only known, reproducible generated files within this production package.
# Source units, review prose, authored plans, and visual references are retained.
$productionRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$knownPatterns = @{
    'prompts' = '^E\d{2}-(?:SH\d{3}(?:-G\d{2})?(?:-start-image)?\.txt|seedance25\.md)$'
    'requests' = '^E\d{2}-SH\d{3}(?:-G\d{2})?\.json$'
    'boards' = '^E\d{2}-board-\d{2}\.(svg|png)$'
    'audio' = '^E\d{2}-(en|zh)\.srt$'
    'scripts' = '^E\d{2}-script\.md$'
    'review' = '^E\d{2}-worksheet\.json$'
}
$targets = @()
foreach ($folder in $knownPatterns.Keys) {
    $directory = Join-Path $productionRoot $folder
    $targets += Get-ChildItem -LiteralPath $directory -File | Where-Object { $_.Name -match $knownPatterns[$folder] }
}
$targets += Get-ChildItem -LiteralPath $productionRoot -File | Where-Object { $_.Name -match '^E\d{2}\.html$' }
foreach ($target in $targets) {
    $resolvedTarget = (Resolve-Path -LiteralPath $target.FullName).Path
    if (-not $resolvedTarget.StartsWith($productionRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Outside production root: $resolvedTarget" }
}
foreach ($target in $targets) { Remove-Item -LiteralPath $target.FullName }
Write-Output ('Removed ' + $targets.Count + ' reproducible files under verified production root.')
