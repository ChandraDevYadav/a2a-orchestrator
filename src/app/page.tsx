"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { QuizForm } from "@/components/QuizForm";
import { QuizChat } from "@/components/QuizChat";
import { QuizDisplay } from "@/components/QuizDisplay";
import { QuizTaker } from "@/components/QuizTaker";
import { A2AAgentInfo } from "@/components/A2AAgentInfo";
import { QuizData, QuizSession } from "@/types/quiz";
import { Brain, BookOpen, Trophy, Zap, Network } from "lucide-react";

export default function Home() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleQuizGenerated = (data: QuizData) => {
    setQuizData(data);
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  const handleStartQuiz = () => {
    if (quizData) {
      const session: QuizSession = {
        id: Date.now().toString(),
        questions: quizData.quiz_questions,
        results: [],
        score: 0,
      };
      setQuizSession(session);
    }
  };

  const handleQuizComplete = (session: QuizSession) => {
    setQuizSession(session);
  };

  const handleReset = () => {
    setQuizData(null);
    setQuizSession(null);
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Features */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardHeader>
            <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <CardTitle className="text-lg">AI-Powered</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Advanced AI generates 20 high-quality multiple-choice questions
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-lg">Smart Content</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Focuses on core teaching content, avoiding irrelevant details
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <CardTitle className="text-lg">Interactive</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Take quizzes immediately with instant scoring and feedback
            </CardDescription>
          </CardContent>
        </Card>
      </div> */}

      {/* A2A Agent Information */}
      {/* <A2AAgentInfo /> */}

      {/* Chat Interface Layout */}
      {!quizData && !quizSession && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Welcome/Instructions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-blue-600" />
                    AI Quiz Generator
                  </CardTitle>
                  <CardDescription>
                    Transform any text content into comprehensive
                    multiple-choice quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">AI-Powered</h3>
                      <p className="text-sm text-gray-600">
                        Advanced AI generates 20 high-quality questions
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Smart Content</h3>
                      <p className="text-sm text-gray-600">
                        Focuses on core concepts and key information
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Interactive</h3>
                      <p className="text-sm text-gray-600">
                        Take quizzes with instant scoring and feedback
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">How it works:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      <li>Paste your text content in the chat on the right</li>
                      <li>
                        Our AI analyzes the content and identifies key concepts
                      </li>
                      <li>
                        Generate 20 multiple-choice questions with varying
                        difficulty
                      </li>
                      <li>Review and take the quiz immediately</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Chat Interface */}
            <div className="lg:col-span-1">
              <QuizChat
                onQuizGenerated={handleQuizGenerated}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                setGenerationProgress={setGenerationProgress}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="max-w-4xl mx-auto mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Generating Quiz...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our AI is analyzing your content and creating questions
                </p>
              </div>
              <Progress value={generationProgress} className="w-full" />
              <p className="text-center text-sm text-gray-500">
                {generationProgress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout - Quiz Display (Left) and Chat Interface (Right) */}
      {quizData && !quizSession && (
        <div className="h-screen flex gap-8 p-8">
          {/* Left Side - Generated Quiz */}
          <div className="flex-1 flex flex-col">
            <Card className="mb-6 flex-shrink-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quiz Generated Successfully!</CardTitle>
                    <CardDescription>
                      {quizData.quiz_questions.length} questions ready
                    </CardDescription>
                  </div>
                  <Button onClick={handleStartQuiz} size="lg">
                    Start Quiz
                  </Button>
                </div>
              </CardHeader>
            </Card>
            <div className="flex-1 overflow-y-auto">
              <QuizDisplay quizData={quizData} />
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="w-[26rem] flex flex-col">
            <QuizChat
              onQuizGenerated={handleQuizGenerated}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              setGenerationProgress={setGenerationProgress}
            />
          </div>
        </div>
      )}

      {/* Quiz Taker */}
      {quizSession && (
        <div className="max-w-4xl mx-auto">
          <QuizTaker
            session={quizSession}
            onComplete={handleQuizComplete}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
