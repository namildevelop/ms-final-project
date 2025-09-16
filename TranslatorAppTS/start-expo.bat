@echo off
echo "네트워크 정보 확인 중..."
ipconfig | findstr "IPv4"

echo.
echo "Expo 서버 시작 중..."
set REACT_NATIVE_PACKAGER_HOSTNAME=10.0.0.2
npx expo start --clear

pause
