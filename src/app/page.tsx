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
import { QuizDataGrid } from "@/components/QuizDataGrid";
import { AGGridExample } from "@/components/AGGridExample";
import { QuizTaker } from "@/components/QuizTaker";
import { A2AAgentInfo } from "@/components/A2AAgentInfo";
import { A2AConfiguration } from "@/components/A2AConfiguration";
import { OrchestratorDashboard } from "@/components/OrchestratorDashboard";
import { OrchestratorChat } from "@/components/OrchestratorChat";
import { MCPInterface } from "@/components/MCPInterface";
import { SimpleChatInterface } from "@/components/SimpleChatInterface";
import { QuizData, QuizSession } from "@/types/quiz";
import {
  Brain,
  BookOpen,
  Trophy,
  Zap,
  Network,
  MessageSquare,
} from "lucide-react";

export default function Home() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [viewMode, setViewMode] = useState<
    "display" | "grid" | "example" | "orchestrator" | "chat" | "mcp" | "simple"
  >("simple");

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
    <div className="min-h-screen bg-gray-50">
      {/* Interface Toggle */}
      {!quizData && !quizSession && (
        <div className="fixed top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setViewMode(viewMode === "simple" ? "mcp" : "simple")
            }
            className="bg-white shadow-lg"
          >
            {viewMode === "simple" ? "Advanced Mode" : "Simple Mode"}
          </Button>
        </div>
      )}

      {/* Simple Interface - Default View */}
      {!quizData && !quizSession && viewMode === "simple" && (
        <SimpleChatInterface
          onQuizGenerated={handleQuizGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          setGenerationProgress={setGenerationProgress}
        />
      )}

      {/* Advanced Interface Options */}
      {!quizData && !quizSession && viewMode !== "simple" && (
        <div className="container mx-auto px-4 py-4">
          {/* A2A Configuration */}
          <div className="max-w-4xl mx-auto mb-6">
            <A2AConfiguration />
          </div>

          {/* Advanced Chat Interface Layout */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Side - Welcome/Instructions */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-6 w-6 text-blue-600" />
                      AI Quiz Generator with MCP
                    </CardTitle>
                    <CardDescription>
                      Transform any text content into comprehensive
                      multiple-choice quizzes using Message Control Protocol
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">MCP Tools</h3>
                        <p className="text-sm text-gray-600">
                          Message Control Protocol enables advanced tool
                          integration
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">
                          Agent Coordination
                        </h3>
                        <p className="text-sm text-gray-600">
                          Multiple AI agents work together seamlessly
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Smart Workflows</h3>
                        <p className="text-sm text-gray-600">
                          Orchestrated processes for complex tasks
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">How MCP works:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Describe your task using natural language</li>
                        <li>
                          MCP automatically selects appropriate tools and agents
                        </li>
                        <li>Agents coordinate to process your request</li>
                        <li>Get intelligent results with full transparency</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Chat Interface */}
              <div className="lg:col-span-3">
                <QuizChat
                  onQuizGenerated={handleQuizGenerated}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                  setGenerationProgress={setGenerationProgress}
                />
              </div>
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
                  <div className="flex gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant={viewMode === "display" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("display")}
                      >
                        Cards
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        Table
                      </Button>
                      <Button
                        variant={viewMode === "example" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("example")}
                      >
                        Example
                      </Button>
                      <Button
                        variant={
                          viewMode === "orchestrator" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setViewMode("orchestrator")}
                      >
                        <Network className="h-4 w-4 mr-1" />
                        Dashboard
                      </Button>
                      <Button
                        variant={viewMode === "chat" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("chat")}
                      >
                        <Brain className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                      <Button
                        variant={viewMode === "mcp" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("mcp")}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        MCP
                      </Button>
                      <Button
                        variant={viewMode === "simple" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("simple")}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Simple
                      </Button>
                    </div>
                    <Button onClick={handleStartQuiz} size="lg">
                      Start Quiz
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {viewMode === "display" && <QuizDisplay quizData={quizData} />}
              {viewMode === "grid" && <QuizDataGrid quizData={quizData} />}
              {viewMode === "example" && <AGGridExample />}
              {viewMode === "orchestrator" && <OrchestratorDashboard />}
              {viewMode === "chat" && (
                <OrchestratorChat
                  onQuizGenerated={handleQuizGenerated}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                  setGenerationProgress={setGenerationProgress}
                />
              )}
              {viewMode === "mcp" && <MCPInterface />}
              {viewMode === "simple" && (
                <SimpleChatInterface
                  onQuizGenerated={handleQuizGenerated}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                  setGenerationProgress={setGenerationProgress}
                />
              )}
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
