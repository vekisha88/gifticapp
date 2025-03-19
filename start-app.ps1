# Giftic App Automated Startup Script
Write-Host "Starting Giftic App automated setup..." -ForegroundColor Cyan

# Store the original directory
$originalDir = Get-Location

# 1. Stop all running processes
Write-Host "Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "All processes stopped" -ForegroundColor Green

# 2. Clear MongoDB collections
Write-Host "Clearing database collections..." -ForegroundColor Yellow
mongosh "mongodb://localhost:27017/giftic" --eval "db.wallets.deleteMany({}); db.gifts.deleteMany({}); print('Database collections cleared');"
Write-Host "Database collections cleared" -ForegroundColor Green

# 3. Start blockchain node - exactly as you do manually
Write-Host "Starting blockchain node..." -ForegroundColor Cyan
$blockchainDir = "$originalDir\packages\blockchain"
Start-Process -FilePath "npx" -ArgumentList "hardhat", "node" -WorkingDirectory $blockchainDir -NoNewWindow -RedirectStandardOutput "$blockchainDir\blockchain.log" -RedirectStandardError "$blockchainDir\blockchain-error.log"
Write-Host "Blockchain node started" -ForegroundColor Cyan

# 4. Deploy contract - exactly as you do manually
Write-Host "Waiting 2 seconds for blockchain to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Write-Host "Deploying smart contract..." -ForegroundColor Cyan
Set-Location $blockchainDir
$deployOutput = npx hardhat run scripts/deploy.ts --network localhost --no-compile
Write-Host $deployOutput -ForegroundColor Cyan
Write-Host "Smart contract deployed" -ForegroundColor Cyan

# 5. Start backend - exactly as you do manually
Write-Host "Starting backend server..." -ForegroundColor Green
$backendDir = "$originalDir\packages\backend"
Set-Location $backendDir
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $backendDir -NoNewWindow -RedirectStandardOutput "$backendDir\backend.log" -RedirectStandardError "$backendDir\backend-error.log"
Write-Host "Backend server started" -ForegroundColor Green

# 6. Start frontend - exactly as you do manually
Write-Host "Waiting 2 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "Starting frontend..." -ForegroundColor Yellow
$frontendDir = "$originalDir\packages\frontend"
Set-Location $frontendDir
Start-Process -FilePath "npm" -ArgumentList "run", "start" -WorkingDirectory $frontendDir -NoNewWindow -RedirectStandardOutput "$frontendDir\frontend.log" -RedirectStandardError "$frontendDir\frontend-error.log"
Write-Host "Frontend started" -ForegroundColor Yellow

# Return to original directory
Set-Location $originalDir

# 7. Show simple message about viewing logs
Write-Host "`nAll services started. Log files are being written to:" -ForegroundColor Magenta
Write-Host "  $blockchainDir\blockchain.log" -ForegroundColor Cyan
Write-Host "  $backendDir\backend.log" -ForegroundColor Green
Write-Host "  $frontendDir\frontend.log" -ForegroundColor Yellow

# 8. Prompt to create gift
Write-Host "`nPlease create a gift in the mobile app now." -ForegroundColor Magenta
Write-Host "After creating the gift, press ENTER to continue to payment simulation." -ForegroundColor Magenta
Read-Host | Out-Null

# 9. Run payment simulation with user input
Write-Host "`nRunning payment simulation..." -ForegroundColor Yellow

# Capture input with simple prompting to avoid double-enter issue
Write-Host -NoNewline "Enter recipient wallet address: "
$walletAddress = [Console]::ReadLine()

Write-Host -NoNewline "Enter amount to send: "
$amount = [Console]::ReadLine()

Write-Host -NoNewline "Enter currency (default: MATIC): "
$currency = [Console]::ReadLine()
if ([string]::IsNullOrWhiteSpace($currency)) {
    $currency = "MATIC"
}

Write-Host -NoNewline "Enter network (default: localhost): "
$network = [Console]::ReadLine()
if ([string]::IsNullOrWhiteSpace($network)) {
    $network = "localhost"
}

Write-Host "Simulating payment of $amount $currency to $walletAddress on $network..." -ForegroundColor Yellow

# Run payment simulation directly using node command
Set-Location $blockchainDir
try {
    node "scripts/simulate-payment.js" "--wallet=$walletAddress" "--amount=$amount" "--currency=$currency" "--network=$network"
} catch {
    Write-Host "Error running payment simulation: $_" -ForegroundColor Red
}
Set-Location $originalDir

Write-Host "`nGiftic App is now fully running!" -ForegroundColor Cyan
Write-Host "To stop all processes, run the following command:" -ForegroundColor Yellow
Write-Host ".\stop-app.ps1" -ForegroundColor DarkYellow 