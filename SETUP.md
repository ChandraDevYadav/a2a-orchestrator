# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Backend quiz service running on port 4001

## Installation Steps

### Option 1: Using the batch script (Windows)

1. Double-click `install.bat` to install all dependencies
2. Double-click `start.bat` to start the development server

### Option 2: Manual installation

1. Open terminal in the quiz-frontend directory
2. Run: `npm install`
3. Run: `npm run dev`

## Environment Setup

Create a `.env.local` file in the quiz-frontend directory with:

```
NEXT_PUBLIC_API_URL=http://localhost:4001
NODE_ENV=development
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4001

## Features Available

✅ AI-powered quiz generation from text content
✅ File upload support (.txt, .md, .doc, .docx)
✅ Interactive quiz taking with timer
✅ Real-time progress updates
✅ Modern UI with dark mode support
✅ Responsive design for all devices
✅ Instant scoring and detailed results

## Troubleshooting

- If port 3000 is busy, Next.js will automatically use the next available port
- Make sure the backend is running before starting the frontend
- Check browser console for any API connection errors
- Ensure all dependencies are installed correctly

## Next Steps

1. Start your backend service: `cd ../quiz-creator-agentic && npm run dev`
2. Start the frontend: `npm run dev`
3. Open http://localhost:3000 in your browser
4. Test the quiz generation and taking features
