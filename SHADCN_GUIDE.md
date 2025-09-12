# Complete Guide: Using shadcn/ui with Next.js

## What is shadcn/ui?

shadcn/ui is a collection of reusable components built using Radix UI and Tailwind CSS. It's not a traditional component library but rather a collection of copy-paste components that you own in your project.

## Your Current Setup ✅

Your project already has shadcn/ui properly configured with:

- **Core Components**: Button, Card, Input, Textarea, Progress
- **Advanced Components**: Dialog, Toast, Toaster
- **Styling**: Tailwind CSS with custom design tokens
- **TypeScript**: Full type safety
- **Utilities**: Custom utility functions

## How to Use shadcn/ui Components

### 1. **Basic Component Usage**

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

### 2. **Button Variants**

```tsx
import { Button } from "@/components/ui/button";

export function ButtonVariants() {
  return (
    <div className="space-x-2">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  );
}
```

### 3. **Dialog Usage**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. **Toast Notifications**

```tsx
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function ToastExample() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success!",
          description: "Your quiz has been generated.",
        });
      }}
    >
      Show Toast
    </Button>
  );
}
```

## Adding More Components

### Method 1: Manual Installation (Recommended)

1. **Install Radix UI primitives:**

```bash
npm install @radix-ui/react-[component-name]
```

2. **Create the component file:**

```bash
# Example: Adding Select component
touch src/components/ui/select.tsx
```

3. **Copy the component code from shadcn/ui docs**

### Method 2: Using shadcn/ui CLI

```bash
# Install shadcn/ui CLI
npm install -g shadcn-ui

# Initialize (if not already done)
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
```

## Common Components You Might Need

### 1. **Select Component**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectExample() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select difficulty" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="easy">Easy</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="hard">Hard</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### 2. **Checkbox Component**

```tsx
import { Checkbox } from "@/components/ui/checkbox";

export function CheckboxExample() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label htmlFor="terms" className="text-sm font-medium">
        Accept terms and conditions
      </label>
    </div>
  );
}
```

### 3. **Radio Group Component**

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function RadioGroupExample() {
  return (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
    </RadioGroup>
  );
}
```

## Customizing Components

### 1. **Modify Existing Components**

```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Add your custom variant
        quiz: "bg-quiz-blue text-white hover:bg-quiz-blue/90",
      },
      // ... rest of variants
    },
  }
);
```

### 2. **Create Custom Components**

```tsx
// src/components/ui/quiz-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";

interface QuizCardProps {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
}

export function QuizCard({ title, difficulty, questionCount }: QuizCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{title}</CardTitle>
          <Badge variant={difficulty === "easy" ? "default" : "destructive"}>
            {difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {questionCount} questions
        </p>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 1. **Component Organization**

```
src/components/
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── forms/              # Form components
│   ├── quiz-form.tsx
│   └── settings-form.tsx
├── layout/              # Layout components
│   ├── header.tsx
│   └── sidebar.tsx
└── features/            # Feature-specific components
    ├── quiz/
    └── dashboard/
```

### 2. **TypeScript Integration**

```tsx
// Always use proper TypeScript
interface QuizFormProps {
  onSubmit: (data: QuizData) => void;
  isLoading?: boolean;
}

export function QuizForm({ onSubmit, isLoading = false }: QuizFormProps) {
  // Component implementation
}
```

### 3. **Accessibility**

- All shadcn/ui components are accessible by default
- Use proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

## Troubleshooting

### Common Issues:

1. **Styling not working:**

   - Check if Tailwind CSS is properly configured
   - Verify CSS variables are defined in globals.css

2. **TypeScript errors:**

   - Ensure all imports are correct
   - Check if component props match the expected types

3. **Components not rendering:**
   - Verify Radix UI primitives are installed
   - Check console for missing dependencies

## Next Steps

1. **Add more components** as needed for your quiz application
2. **Customize the design system** to match your brand
3. **Create reusable component patterns** for your specific use cases
4. **Test components** thoroughly across different screen sizes

Your quiz application is already well-structured with shadcn/ui! You can now easily add more components and customize them to fit your needs.
