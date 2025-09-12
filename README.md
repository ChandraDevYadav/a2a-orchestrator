# Quiz Creator Frontend

A modern Next.js frontend for the Quiz Creator application, built with TypeScript, Tailwind CSS, and shadcn/ui components. This frontend integrates with the Agent2Agent Protocol backend to create and take AI-generated quizzes.

## Features

- 🤖 **AI-Powered Quiz Generation**: Generate 20 high-quality multiple-choice questions from any text content
- 📝 **Smart Content Analysis**: Focuses on core teaching content, avoiding irrelevant details
- 🎯 **Interactive Quiz Taking**: Take quizzes immediately with instant scoring and feedback
- ⏱️ **Timer Support**: Built-in timer for quiz sessions
- 📊 **Progress Tracking**: Visual progress indicators and detailed results
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 🔄 **Real-time Updates**: Live progress updates during quiz generation

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: React hooks
- **API Integration**: Fetch API with custom client

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend quiz service running on port 4001

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001
NODE_ENV=development
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── QuizForm.tsx   # Quiz creation form
│   ├── QuizDisplay.tsx # Quiz preview
│   └── QuizTaker.tsx  # Interactive quiz
├── lib/               # Utility functions
│   ├── api-client.ts  # API client
│   └── utils.ts       # Helper functions
├── hooks/             # Custom React hooks
└── types/             # TypeScript type definitions
    └── quiz.ts        # Quiz-related types
```

## API Integration

The frontend communicates with the backend through two main endpoints:

- `POST /api/actions/generate-quiz` - Generate quiz without usage tracking
- `POST /api/actions/openai` - Generate quiz with usage tracking
- `GET /health` - Health check

## Features in Detail

### Quiz Generation

- Text input with word count validation (max 10,000 words)
- File upload support for .txt, .md, .doc, .docx files
- Real-time progress updates during generation
- Error handling with user-friendly messages

### Quiz Taking

- Interactive multiple-choice interface
- Timer with automatic completion
- Progress tracking
- Instant scoring and feedback
- Detailed results with pass/fail indication

### UI/UX

- Responsive design for all screen sizes
- Dark mode support
- Smooth animations and transitions
- Accessible components with proper ARIA labels
- Loading states and error boundaries

## Customization

### Styling

The app uses Tailwind CSS with custom design tokens. You can customize:

- Colors in `tailwind.config.js`
- Global styles in `src/app/globals.css`
- Component styles using Tailwind classes

### Components

All UI components are built with shadcn/ui and can be customized:

- Modify component variants in `src/components/ui/`
- Add new components following the same pattern
- Extend existing components as needed

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Make sure to set:

- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `NODE_ENV=production`

### Deployment Platforms

This app can be deployed to:

- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any Node.js hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Agent2Agent Protocol ecosystem.
