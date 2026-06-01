# Tab Mover — Instalacao permanente
# Executa como administrador para aplicar politica de registro

$extensionPath = "C:\Users\junio\OneDrive\Área de Trabalho\Projetos\tab edge"

Write-Host ""
Write-Host "=== Tab Mover — Instalacao permanente ===" -ForegroundColor Cyan
Write-Host ""

# 1. Politica de registro: impede o Edge de desativar extensoes de dev a cada reinicio
Write-Host "Configurando politica do Edge..." -ForegroundColor Yellow

$policyPath = "HKCU:\SOFTWARE\Policies\Microsoft\Edge"
if (-not (Test-Path $policyPath)) {
    New-Item -Path $policyPath -Force | Out-Null
}
Set-ItemProperty -Path $policyPath -Name "DeveloperToolsAvailability" -Value 1 -Type DWord

Write-Host "  OK - Modo desenvolvedor do Edge protegido" -ForegroundColor Green

# 2. Atalho de inicializacao: abre Edge com a extensao carregada silenciosamente
Write-Host "Criando atalho de inicializacao do Windows..." -ForegroundColor Yellow

# Localiza o executavel do Edge
$edgeExe = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edgeExe) {
    Write-Host "  AVISO: Executavel do Edge nao encontrado. Pulando atalho." -ForegroundColor Red
} else {
    $startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath  = "$startupFolder\TabMover_Edge.lnk"

    $wsh      = New-Object -ComObject WScript.Shell
    $shortcut = $wsh.CreateShortcut($shortcutPath)
    $shortcut.TargetPath  = $edgeExe
    # --no-startup-window abre o Edge em segundo plano, sem janela visivel
    $shortcut.Arguments   = "--no-startup-window --load-extension=`"$extensionPath`""
    $shortcut.WindowStyle = 7
    $shortcut.Description = "Carrega extensao Tab Mover no Edge (segundo plano)"
    $shortcut.Save()

    Write-Host "  OK - Atalho criado em: $shortcutPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pronto!" -ForegroundColor Cyan
Write-Host "Reinicie o PC e a extensao vai carregar automaticamente." -ForegroundColor White
Write-Host ""
Read-Host "Pressione Enter para fechar"
