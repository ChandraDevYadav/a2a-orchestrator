@echo off
echo Installing Quiz Frontend Dependencies...
echo.

cd /d "%~dp0"

echo Installing core dependencies...
npm install next@latest react@latest react-dom@latest typescript @types/react @types/react-dom @types/node

echo Installing Tailwind CSS...
npm install tailwindcss postcss autoprefixer

echo Installing shadcn/ui dependencies...
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-toast @radix-ui/react-progress
npm install class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate

echo Installing development dependencies...
npm install --save-dev eslint eslint-config-next

echo.
echo Installation complete!
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Make sure your backend is running on port 4001.
pause
