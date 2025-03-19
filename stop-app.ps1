# Giftic App Stop Script
Write-Host "Stopping Giftic App processes..." -ForegroundColor Red

# Kill all node and npm processes 
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Stopping node process with PID: $($_.Id)..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Get-Process -Name "npm" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Stopping npm process with PID: $($_.Id)..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "All Giftic App processes have been stopped." -ForegroundColor Green

# Clear MongoDB collections
Write-Host "Clearing database collections..." -ForegroundColor Yellow
mongosh "mongodb://localhost:27017/giftic" --eval "db.wallets.deleteMany({}); db.gifts.deleteMany({}); print('Database collections cleared');"
Write-Host "Database collections cleared" -ForegroundColor Green 