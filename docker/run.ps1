# Markdown-to-PDF Docker Run Script
# Automatically finds an available port and starts the container

param(
    [int]$StartPort = 3000,
    [int]$MaxAttempts = 10,
    [switch]$Build,
    [switch]$Detach
)

$ErrorActionPreference = "Stop"

function Test-PortAvailable {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

function Find-AvailablePort {
    param([int]$StartPort, [int]$MaxAttempts)

    for ($i = 0; $i -lt $MaxAttempts; $i++) {
        $port = $StartPort + $i
        if (Test-PortAvailable -Port $port) {
            return $port
        }
        Write-Host "Port $port is busy, trying next..." -ForegroundColor Yellow
    }

    throw "Could not find an available port after $MaxAttempts attempts"
}

# Find available port
Write-Host "Finding available port..." -ForegroundColor Cyan
$port = Find-AvailablePort -StartPort $StartPort -MaxAttempts $MaxAttempts
Write-Host "Using port: $port" -ForegroundColor Green

# Set environment variable
$env:PORT = $port

# Change to docker directory
Push-Location $PSScriptRoot

try {
    # Stop existing container if running
    Write-Host "Stopping existing container..." -ForegroundColor Cyan
    docker-compose down 2>$null

    # Build if requested
    if ($Build) {
        Write-Host "Building Docker image..." -ForegroundColor Cyan
        docker-compose build
    }

    # Run container
    Write-Host "Starting Markdown-to-PDF container..." -ForegroundColor Cyan

    if ($Detach) {
        docker-compose up -d
        Write-Host ""
        Write-Host "Container started successfully!" -ForegroundColor Green
        Write-Host "Access the application at: http://localhost:$port" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To view logs: docker logs -f markdown-to-pdf" -ForegroundColor Gray
        Write-Host "To stop: docker-compose -f docker/docker-compose.yml down" -ForegroundColor Gray
    } else {
        Write-Host "Access the application at: http://localhost:$port" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        docker-compose up
    }
} finally {
    Pop-Location
}
