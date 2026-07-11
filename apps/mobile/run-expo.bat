@echo off
set NODE_PATH=C:\Users\HI\AppData\Local\Temp\node-v22.14.0-win-x64
set PATH=%NODE_PATH%;%PATH%
cd /d D:\GitHub\TestDeepSeekFlash\apps\mobile
echo Using Node.js 
%NODE_PATH%\node.exe --version
echo Starting Expo...
%NODE_PATH%\node.exe -e "console.log('Hello from Node 22')"
%NODE_PATH%\node.exe .\node_modules\expo\bin\cli.js start --android
pause
