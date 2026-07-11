# Run Expo mobile app on Android emulator with Node.js 22
$nodePath = "/tmp/node-v22.14.0-win-x64"
$env:Path = "$nodePath;$env:Path"

Write-Host "Using Node.js $(& node --version)"
Write-Host "Starting Expo for Android..."

# Kill any existing Expo processes
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "expo|metro" } | Stop-Process -Force

# Start Expo
npx expo start --android
