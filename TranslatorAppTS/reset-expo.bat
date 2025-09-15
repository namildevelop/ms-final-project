@echo off
echo Stopping any running processes...
taskkill /f /im node.exe 2>nul

echo Cleaning project...
if exist node_modules rmdir /s /q node_modules
if exist .expo rmdir /s /q .expo
if exist package-lock.json del package-lock.json

echo Clearing npm cache...
npm cache clean --force

echo Clearing Windows temp files...
del /q /s "%LOCALAPPDATA%\Temp\haste-map-*" 2>nul
del /q /s "%LOCALAPPDATA%\Temp\metro-cache" 2>nul

echo Reinstalling packages...
npm install

echo Starting Expo with fresh cache...
npx expo start --clear --reset-cache

pause
