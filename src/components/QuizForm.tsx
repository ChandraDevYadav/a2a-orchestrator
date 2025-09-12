"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { quizApiClient } from "@/lib/api-client";
import { QuizData } from "@/types/quiz";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface QuizFormProps {
  onQuizGenerated: (data: QuizData) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
}

export function QuizForm({
  onQuizGenerated,
  isGenerating,
  setIsGenerating,
  setGenerationProgress,
}: QuizFormProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleInputChange = (value: string) => {
    setInput(value);
    setError("");
    const words = value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleInputChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError("Please enter some text content");
      return;
    }

    if (wordCount > 10000) {
      setError("Content is too long. Please keep it under 10,000 words.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setProgress(0);
    setGenerationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev >= 90 ? 90 : prev + Math.random() * 15;
          setGenerationProgress(newProgress);
          if (prev >= 90) {
            clearInterval(progressInterval);
          }
          return newProgress;
        });
      }, 500);

      const response = await quizApiClient.generateQuiz(input.trim());

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Small delay to show 100% completion
      setTimeout(() => {
        onQuizGenerated(response.data);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz. Please try again.");
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Upload Text File (Optional)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".txt,.md,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={isGenerating}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            Choose File
          </label>
          <span className="text-sm text-gray-500">
            Supports .txt, .md, .doc, .docx files
          </span>
        </div>
      </div>

      {/* Text Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Or Enter Text Content Directly
        </label>
        <Textarea
          placeholder="Paste your text content here... (e.g., lecture notes, articles, documentation, etc.)"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          className="min-h-[200px] resize-none"
          disabled={isGenerating}
        />
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{wordCount} words</span>
          <span className={wordCount > 10000 ? "text-red-500" : ""}>
            Max: 10,000 words
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !input.trim() || wordCount > 10000}
          size="lg"
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Quiz
            </div>
          )}
        </Button>
      </div>

      {/* Tips */}
      {/* <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Tips for Better Results:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • Include comprehensive content with clear concepts and facts
            </li>
            <li>• Avoid too much conversational or irrelevant text</li>
            <li>
              • Focus on educational material, documentation, or structured
              content
            </li>
            <li>
              • The AI will generate 20 multiple-choice questions with balanced
              difficulty
            </li>
          </ul>
        </CardContent>
      </Card> */}
    </div>
  );
}
