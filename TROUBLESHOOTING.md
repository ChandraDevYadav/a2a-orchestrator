# Troubleshooting Guide for Next.js + shadcn/ui

## ✅ Issue Resolved: 'next' is not recognized

**Problem**: `'next' is not recognized as an internal or external command`

**Solution**: Install dependencies first

```bash
cd quiz-frontend
npm install
npm run dev
```

## Common Issues and Solutions

### 1. **Dependencies Not Installed**

```bash
# Error: 'next' is not recognized
# Solution:
npm install
```

### 2. **TypeScript Errors**

```bash
# Error: Cannot find module '@/components/ui/button'
# Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. **Tailwind CSS Not Working**

```bash
# Error: Styles not applying
# Solution: Check tailwind.config.js content paths
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
}
```

### 4. **Missing Radix UI Primitives**

```bash
# Error: Cannot resolve '@radix-ui/react-dialog'
# Solution: Install missing primitives
npm install @radix-ui/react-dialog @radix-ui/react-toast
```

### 5. **Port Already in Use**

```bash
# Error: Port 3000 is already in use
# Solution: Use different port
npm run dev -- -p 3001
```

### 6. **Build Errors**

```bash
# Error: Build fails
# Solution: Check for syntax errors and missing imports
npm run build
```

## Quick Start Commands

```bash
# 1. Navigate to project
cd quiz-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

## Project Structure Check

Ensure you have this structure:

```
quiz-frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── toast.tsx
│   │   └── QuizForm.tsx
│   ├── hooks/
│   │   └── use-toast.ts
│   └── lib/
│       └── utils.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Environment Setup

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001
NODE_ENV=development
```

## Testing Components

1. **Basic Button Test**:

```tsx
import { Button } from "@/components/ui/button";

export default function Test() {
  return <Button>Test Button</Button>;
}
```

2. **Toast Test**:

```tsx
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Test() {
  const { toast } = useToast();

  return <Button onClick={() => toast({ title: "Test" })}>Test Toast</Button>;
}
```

## Development Tips

1. **Hot Reload**: Changes should appear automatically
2. **Console Errors**: Check browser console for errors
3. **TypeScript**: Use proper imports and types
4. **Styling**: Use Tailwind classes for styling
5. **Components**: Import from `@/components/ui/`

## Next Steps

1. ✅ Dependencies installed
2. ✅ Development server running
3. ✅ Components ready to use
4. 🔄 Test the application
5. 🔄 Customize components as needed

Your Next.js + shadcn/ui application is now ready to use!
