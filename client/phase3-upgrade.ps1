# Phase 3 Token Migration Script
$files = @(
  'src/pages/HistoricalTimeline.tsx',
  'src/pages/WhatIfLab.tsx',
  'src/pages/AgricultureAdvisor.tsx',
  'src/pages/RecoveryTracker.tsx',
  'src/pages/SafetyProfile.tsx',
  'src/pages/LearnHub.tsx'
)

$replacements = @(
  @('pt-safe-area', ''),
  @('bg-primary-bg', 'bg-bg-primary'),
  @('bg-card-bg', 'bg-bg-card'),
  @('critical-red', 'critical'),
  @('warning-orange', 'warning'),
  @('safe-green', 'safe'),
  @('info-blue', 'info'),
  @('caution-yellow', 'caution'),
  @('rounded-soft', 'rounded-card'),
  @('border-gray-200', 'border-border-light'),
  @('shadow-soft', 'shadow-card'),
  @('primary-text', 'text-primary'),
  @('secondary-text', 'text-secondary'),
  @('card-bg', 'bg-card')
)

foreach ($file in $files) {
  if (!(Test-Path $file)) {
    Write-Host "⚠ File not found: $file"
    continue
  }
  
  $content = Get-Content $file -Raw
  
  foreach ($pair in $replacements) {
    $content = $content -replace [regex]::Escape($pair[0]), $pair[1]
  }
  
  Set-Content $file -Value $content -Encoding UTF8
  Write-Host "✓ $file"
}

Write-Host "Phase 3 migration complete!"
