@echo off
echo Starting Quiz Frontend Development Server...
echo.

cd /d "%~dp0"

echo Starting Next.js development server...
echo The app will be available at http://localhost:3000
echo Make sure your backend is running on port 4001
echo.

npm run dev

pause
