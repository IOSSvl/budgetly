param(
  [string]$ServerUser = "ioss",
  [string]$ServerHost = "192.168.178.187",
  [string]$ProjectDir = "C:\Users\ranoc\Documents\Risparmi",
  [string]$ZipPath = "C:\Users\ranoc\Documents\budgetly-deploy.zip"
)

$ErrorActionPreference = "Stop"

Write-Host "Creo zip deploy..."
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path "$ProjectDir\*" -DestinationPath $ZipPath -Force

Write-Host "Upload zip su server..."
$scpTarget = "${ServerUser}@${ServerHost}:/home/${ServerUser}/"
$scpCmd = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpCmd) {
  $scpExe = "$env:WINDIR\System32\OpenSSH\scp.exe"
  if (-not (Test-Path $scpExe)) {
    throw "scp non trovato. Installa OpenSSH Client nelle Funzionalità opzionali di Windows."
  }
  & $scpExe $ZipPath $scpTarget
} else {
  & $scpCmd.Source $ZipPath $scpTarget
}

Write-Host "Eseguo deploy sul server..."
ssh "$ServerUser@$ServerHost" "sudo cp /home/$ServerUser/budgetly-deploy.zip /opt/ && sudo bash /opt/budgetly/scripts/deploy-server.sh"

Write-Host "Deploy finito."
