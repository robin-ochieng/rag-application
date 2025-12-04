# Start RAG Application
# This script starts both the backend (FastAPI) and frontend (Next.js)

Write-Host "Starting RAG Application..." -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Activate Python virtual environment
$venvPath = Join-Path $PSScriptRoot ".venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    Write-Host "Activating Python virtual environment..." -ForegroundColor Yellow
    & $venvPath
} else {
    Write-Host "Warning: Virtual environment not found at $venvPath" -ForegroundColor Red
}

# Start backend in a new PowerShell window
Write-Host "Starting FastAPI backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendScript = @"
cd '$PSScriptRoot'
& '$venvPath'
uvicorn app_fastapi:app --host 127.0.0.1 --port 8000 --reload
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Next.js frontend on http://127.0.0.1:3000..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "web"
$frontendScript = @"
cd '$frontendPath'
pnpm dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host ""
Write-Host "Application started!" -ForegroundColor Cyan
Write-Host "- Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "- Frontend: http://127.0.0.1:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
