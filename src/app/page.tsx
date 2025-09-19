"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnifiedChat } from "@/components/UnifiedChat";
import { QuizDisplay } from "@/components/QuizDisplay";
import { ManualDisplay } from "@/components/ManualDisplay";
import { QuizData } from "@/types/quiz";
import { Brain, BookOpen, MessageSquare, X } from "lucide-react";

export default function Home() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [manualData, setManualData] = useState<any>(null);
  const [activeView, setActiveView] = useState<"chat" | "quiz" | "manual">(
    "chat"
  );

  const handleQuizGenerated = (data: QuizData) => {
    setQuizData(data);
    // Don't automatically switch view - let user stay in chat to see center panel
    // setActiveView("quiz");
  };

  const handleManualGenerated = (data: any) => {
    setManualData(data);
    // Don't automatically switch view - let user stay in chat to see center panel
    // setActiveView("manual");
  };

  const handleBackToChat = () => {
    setActiveView("chat");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto p-4">
        {/* Header */}
        <div className="text-center">
          {/* <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Assistant Hub
          </h1> */}
          {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your unified AI assistant for quiz generation, manual creation, and
            general chat. Simply type what you need and I&apos;ll handle the
            rest!
          </p> */}
        </div>

        {/* Main Content */}
        <div className="max-w-full mx-auto">
          {activeView === "chat" && (
            <div className="">
              <UnifiedChat
                onQuizGenerated={handleQuizGenerated}
                onManualGenerated={handleManualGenerated}
              />
            </div>
          )}

          {activeView === "quiz" && quizData && (
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <CardTitle>Generated Quiz</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToChat}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Back to Chat
                </Button>
              </CardHeader>
              <CardContent>
                <QuizDisplay quizData={quizData} />
              </CardContent>
            </Card>
          )}

          {activeView === "manual" && manualData && (
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <CardTitle>Generated Manual</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToChat}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Back to Chat
                </Button>
              </CardHeader>
              <CardContent>
                <ManualDisplay manual={manualData} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        {/* <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => setActiveView("chat")}
                >
                  <MessageSquare className="h-6 w-6 text-purple-500" />
                  <span>Start Chat</span>
                </Button>
                        <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => setActiveView("quiz")}
                  disabled={!quizData}
                >
                  <Brain className="h-6 w-6 text-blue-500" />
                  <span>View Quiz</span>
                        </Button>
                        <Button
                          variant="outline"
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => setActiveView("manual")}
                  disabled={!manualData}
                        >
                  <BookOpen className="h-6 w-6 text-green-500" />
                  <span>View Manual</span>
                        </Button>
                      </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Features */}
        {/* <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">What I Can Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Quiz Generation
                    </h3>
                    <p className="text-gray-600 text-sm">
                    Create comprehensive quizzes on any topic with
                    multiple-choice questions, correct answers, and varied
                    difficulty levels.
                    </p>
                  </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Manual Creation
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Generate detailed manuals and documentation with structured
                    sections, step-by-step instructions, and comprehensive
                    coverage.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
                  <h3 className="font-semibold text-lg mb-2">General Chat</h3>
                  <p className="text-gray-600 text-sm">
                    Have conversations, ask questions, get explanations, and
                    receive helpful information on any topic.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  );
}
