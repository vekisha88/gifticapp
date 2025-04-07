# GifticApp Startup Script
# Starts blockchain, backend, and frontend in separate terminals

# Store the root directory at the start
$rootDir = Get-Location

# Function to check if a port is in use
function Test-PortInUse {
    param(
        [int]$Port
    )
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    try {
        $connect = $tcpClient.BeginConnect("127.0.0.1", $Port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(100)
        if ($wait) {
            return $true
        }
        return $false
    }
    finally {
        $tcpClient.Close()
    }
}

# Enhanced function to kill processes on specific ports
function Stop-ProcessOnPort {
    param(
        [int]$Port,
        [switch]$Force = $false
    )
    
    Write-Host "Attempting to free port $Port..." -ForegroundColor Yellow
    
    # Method 1: Find using netstat
    $netstat = netstat -ano | findstr ":$Port "
    if ($netstat) {
        $lines = $netstat -split "`n"
        foreach ($line in $lines) {
            if ($line -match ":$Port\s+") {
                $processId = ($line -split "\s+")[-1]
                if ($processId -match "^\d+$") {
                    try {
                        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-Host "Found process $($process.Name) (PID: $processId) using port $Port" -ForegroundColor Yellow
                            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                            Write-Host "Stopped process with PID $processId" -ForegroundColor Green
                        }
                    }
                    catch {
                        $errorMsg = $_.Exception.Message
                        Write-Host "Error stopping PID $processId`: $errorMsg" -ForegroundColor Red
                    }
                }
            }
        }
    }
    
    # Method 2: Try the TCP kill method for Windows
    try {
        # This command forcibly closes TCP connections on the specified port
        $null = netsh interface ipv4 delete tcpconnection localport=$Port
        Write-Host "Released TCP connections on port $Port" -ForegroundColor Yellow
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "Could not release TCP connections`: $errorMsg" -ForegroundColor Red
    }
    
    # Wait briefly and verify port is really free
    Start-Sleep -Seconds 2
    if (Test-PortInUse -Port $Port) {
        Write-Host "Warning: Port $Port is still in use after cleanup attempts" -ForegroundColor Red
        
        if ($Force) {
            # As a last resort on Windows, use more aggressive methods
            Write-Host "Attempting aggressive port cleanup for $Port..." -ForegroundColor Yellow
            
            # Find all node processes that might be problematic
            $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
            foreach ($proc in $nodeProcesses) {
                try {
                    if ($proc.MainWindowTitle -like "*hardhat*" -or 
                        $proc.MainWindowTitle -like "*blockchain*" -or 
                        $proc.MainWindowTitle -like "*ethereum*") {
                        Write-Host "Killing potential blockchain Node.js process: $($proc.Id)" -ForegroundColor Yellow
                        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    }
                }
                catch {
                    # Ignore process access errors
                }
            }
        }
    }
    else {
        Write-Host "Successfully freed port $Port" -ForegroundColor Green
    }
}

# Clean up existing processes - force kill them to ensure clean state
Write-Host "Checking for existing processes and freeing ports..."
$portsToFree = @(8545, 8000, 19000, 8081)

foreach ($port in $portsToFree) {
    Stop-ProcessOnPort -Port $port -Force # Add -Force to ensure processes are killed
}

Write-Host "Waiting for ports to fully release..."
Start-Sleep -Seconds 3 # Increase wait time slightly

# Verify directory paths
Write-Host "Verifying directory paths..."
$blockchainDir = Join-Path $rootDir "packages\blockchain"
$backendDir = Join-Path $rootDir "packages\backend"
$frontendDir = Join-Path $rootDir "packages\frontend"

Write-Host "Blockchain directory: $blockchainDir"
Write-Host "Backend directory: $backendDir"
Write-Host "Frontend directory: $frontendDir"

# Start blockchain node
Write-Host "Starting blockchain node in a new window..."
$attempt = 1
$maxAttempts = 3
$nodeStarted = $false

while (-not $nodeStarted -and $attempt -le $maxAttempts) {
    Write-Host "Blockchain node starting in a new window (PID: $pid) - Attempt $attempt of $maxAttempts"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$blockchainDir'; npx hardhat node"
    Write-Host "Waiting for blockchain node to initialize (1 seconds)..."
    Start-Sleep -Seconds 1
    
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8545" -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"net_version","id":1}' -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $nodeStarted = $true
            Write-Host "Blockchain node verified running!"
        }
    } catch {
        Write-Host "Attempt $attempt failed. Retrying..."
        $attempt++
        Start-Sleep -Seconds 2
    }
}

if (-not $nodeStarted) {
    Write-Host "Failed to start blockchain node after $maxAttempts attempts"
    exit 1
}

# Deploy smart contract
Write-Host "Deploying smart contract..."
Write-Host "Current directory: $blockchainDir"
Write-Host "Waiting 1 seconds for blockchain node to stabilize..."
Start-Sleep -Seconds 1
Set-Location $blockchainDir
Write-Host "Deploying Contract..."
npx hardhat run scripts/deploy.ts --network localhost
Write-Host "[+] Contract deployment finished."

# Start backend server
Write-Host "Starting backend server in a new window..."
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev" -PassThru
Write-Host "Backend starting in a new window (PID: $($backendProcess.Id))"
Write-Host "Waiting for backend server to initialize (5 seconds)..."
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend in a new window..."
Write-Host "Installing tunnel dependencies..."
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm install --save @expo/ngrok; npx expo start --tunnel" -PassThru
Write-Host "Frontend started in a new window (PID: $($frontendProcess.Id))"

Write-Host "`n+----------------------------------------+"
Write-Host "|           GifticApp is running!         |"
Write-Host "|                                        |"
Write-Host "| Services:                              |"
Write-Host "| * Blockchain node: Running             |"
Write-Host "| * Backend server:  Running             |"
Write-Host "| * Frontend:        Running             |"
Write-Host "|                                        |"
Write-Host "| Check the frontend window for QR code. |"
Write-Host "| The app will be accessible via tunnel. |"
Write-Host "|                                        |"
Write-Host "| Press Ctrl+C here to stop script.      |"
Write-Host "+----------------------------------------+`n"

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Cleanup on script exit
    Write-Host "`nStopping services..."
    if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force }
    if ($frontendProcess) { Stop-Process -Id $frontendProcess.Id -Force }
    Get-Process | Where-Object { $_.Name -eq 'node' } | Stop-Process -Force
} 