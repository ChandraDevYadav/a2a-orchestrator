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
import { QuizTaker } from "@/components/QuizTaker";
import { A2AAgentInfo } from "@/components/A2AAgentInfo";
import { A2AConfiguration } from "@/components/A2AConfiguration";
import { QuizData, QuizSession } from "@/types/quiz";
import {
  Brain,
  BookOpen,
  Trophy,
  Zap,
  Network,
  MessageSquare,
  Send,
  Plus,
  Lightbulb,
  Target,
  Globe,
  Copy,
} from "lucide-react";

export default function Home() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [viewMode, setViewMode] = useState<"display" | "grid">("display");

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

  const handleCopyQuiz = async () => {
    if (!quizData) return;

    // Create a modal with the quiz text that users can copy from
    const quizText = formatQuizText();

    // Create modal element
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
      overflow: hidden;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      width: min(90%, 1000px);
      height: min(90%, 80vh);
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 40px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
      position: relative;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    `;

    const title = document.createElement("h3");
    title.textContent = "Copy Quiz Text";
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    `;

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    `;
    closeButton.onmouseover = () =>
      (closeButton.style.backgroundColor = "#f3f4f6");
    closeButton.onmouseout = () =>
      (closeButton.style.backgroundColor = "transparent");

    const textArea = document.createElement("textarea");
    textArea.value = quizText;
    textArea.style.cssText = `
      width: 100%;
      min-height: 400px;
      border: none;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      box-sizing: border-box;
      background-color: transparent;
      outline: none;
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 15px;
      justify-content: flex-end;
    `;

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy to Clipboard";
    copyButton.style.cssText = `
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    copyButton.onmouseover = () =>
      (copyButton.style.backgroundColor = "#2563eb");
    copyButton.onmouseout = () =>
      (copyButton.style.backgroundColor = "#3b82f6");

    const selectAllButton = document.createElement("button");
    selectAllButton.textContent = "Select All";
    selectAllButton.style.cssText = `
      background-color: #6b7280;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    selectAllButton.onmouseover = () =>
      (selectAllButton.style.backgroundColor = "#4b5563");
    selectAllButton.onmouseout = () =>
      (selectAllButton.style.backgroundColor = "#6b7280");

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText = `
      background-color: #e5e7eb;
      color: #374151;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    cancelButton.onmouseover = () =>
      (cancelButton.style.backgroundColor = "#d1d5db");
    cancelButton.onmouseout = () =>
      (cancelButton.style.backgroundColor = "#e5e7eb");

    // Event handlers
    closeButton.onclick = () => {
      document.body.removeChild(modal);
    };

    cancelButton.onclick = () => {
      document.body.removeChild(modal);
    };

    selectAllButton.onclick = () => {
      textArea.select();
    };

    copyButton.onclick = async () => {
      try {
        textArea.select();
        const successful = document.execCommand("copy");
        if (successful) {
          copyButton.textContent = "Copied!";
          copyButton.style.backgroundColor = "#10b981";
          setTimeout(() => {
            copyButton.textContent = "Copy to Clipboard";
            copyButton.style.backgroundColor = "#3b82f6";
          }, 2000);
        } else {
          alert("Please manually select and copy the text (Ctrl+C)");
        }
      } catch (err) {
        alert("Please manually select and copy the text (Ctrl+C)");
      }
    };

    // Create scrollable container for textarea
    const scrollContainer = document.createElement("div");
    scrollContainer.style.cssText = `
      flex: 1;
      overflow: scroll;
      overflow-x: hidden;
      overflow-y: scroll;
      display: flex;
      flex-direction: column;
      min-height: 0;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background-color: #f9fafb;
    `;

    // Assemble modal
    header.appendChild(title);
    header.appendChild(closeButton);
    buttonContainer.appendChild(selectAllButton);
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(cancelButton);

    scrollContainer.appendChild(textArea);
    modalContent.appendChild(header);
    modalContent.appendChild(scrollContainer);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    // Add to page and auto-select text
    document.body.appendChild(modal);
    textArea.select();
  };

  const formatQuizText = () => {
    if (!quizData) return "";

    const header = `Quiz: Generated Quiz\nQuestions: ${quizData.quiz_questions.length}\n\n`;

    const questionsText = quizData.quiz_questions
      .map((question, index) => {
        const questionText = `${index + 1}. ${
          question.question || "No question text"
        }`;

        // Safely handle answers with fallbacks
        const options = [];

        if (question.answers && Array.isArray(question.answers)) {
          question.answers.forEach((answer, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, E
            if (answer && answer.answer) {
              options.push(`${optionLetter}. ${answer.answer}`);
            }
          });
        } else {
          // Fallback if answers is null/undefined or not an array
          options.push("A. No options available");
        }

        const correctAnswer = `Correct Answer: ${
          question.correct_answer || "No correct answer specified"
        }`;

        return [questionText, ...options, correctAnswer].join("\n");
      })
      .join("\n\n");

    return header + questionsText;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Single Unified Interface */}
      {!quizData && !quizSession && (
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          {/* <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Hello, I am Quiz Agent! 🤖
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I can create quizzes from any topic or help you with general
              questions—just tell me what you need, and I'll assist you.
            </p>
          </div> */}

          {/* Quick Action Buttons */}
          {/* <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button
              variant="outline"
              className="px-6 py-3 rounded-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
            <Button
              variant="outline"
              className="px-6 py-3 rounded-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Science Topics
            </Button>
            <Button
              variant="outline"
              className="px-6 py-3 rounded-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              History Quiz
            </Button>
            <Button
              variant="outline"
              className="px-6 py-3 rounded-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              <Target className="h-4 w-4 mr-2" />
              Math Problems
            </Button>
            <Button
              variant="outline"
              className="px-6 py-3 rounded-full bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <Globe className="h-4 w-4 mr-2" />
              General Knowledge
            </Button>
          </div> */}

          {/* Main Content Area */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Features & Info */}
              <div className="lg:col-span-1">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-6 w-6 text-blue-600" />
                      A2A Agent
                    </CardTitle>
                    <CardDescription>
                      Powered by A2A Protocol and advanced AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <div>
                          <h4 className="font-semibold text-sm">
                            A2A Protocol
                          </h4>
                          <p className="text-xs text-gray-600">
                            Agent-to-agent communication
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-green-500" />
                        <div>
                          <h4 className="font-semibold text-sm">
                            Smart Generation
                          </h4>
                          <p className="text-xs text-gray-600">
                            AI-powered quiz creation
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Trophy className="h-5 w-5 text-purple-500" />
                        <div>
                          <h4 className="font-semibold text-sm">
                            Interactive Chat
                          </h4>
                          <p className="text-xs text-gray-600">
                            Natural conversation interface
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* A2A Configuration */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-blue-600" />
                      A2A Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <A2AConfiguration />
                  </CardContent>
                </Card> */}
              </div>

              {/* Right Side - Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="h-[550px] flex flex-col overflow-hidden">
                  {/* <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Chat with Quiz Agent
                    </CardTitle>
                    <CardDescription>
                      Ask me to create a quiz or help with any questions
                    </CardDescription>
                  </CardHeader> */}
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <QuizChat
                      onQuizGenerated={handleQuizGenerated}
                      isGenerating={isGenerating}
                      setIsGenerating={setIsGenerating}
                      setGenerationProgress={setGenerationProgress}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          {/* <div className="flex justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Agent Online
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="h-4 w-4" />
              Chat Ready
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              Quiz Creation
            </div>
          </div> */}
        </div>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Generating Quiz...
                  </h3>
                  <p className="text-sm text-gray-600">
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
        </div>
      )}

      {/* Quiz Display and Chat Side by Side */}
      {quizData && !quizSession && (
        <div className="h-screen flex gap-6 p-6">
          {/* Left Side - Generated Quiz */}
          <div className="flex-1 flex flex-col">
            <Card className="mb-4 flex-shrink-0">
              <CardHeader>
                <div className="flex justify-end items-center">
                  {/* <div>
                    <CardTitle className="text-green-600">
                      ✅ Quiz Generated Successfully!
                    </CardTitle>
                    <CardDescription>
                      {quizData.quiz_questions.length} questions ready
                    </CardDescription>
                  </div> */}
                  <div className="flex gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant={viewMode === "display" ? "default" : "outline"}
                        size="lg"
                        onClick={() => setViewMode("display")}
                      >
                        Cards
                      </Button>
                      {/* <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        Table
                      </Button> */}
                    </div>
                    <Button
                      onClick={handleCopyQuiz}
                      size="lg"
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Quiz
                    </Button>
                    <Button
                      onClick={handleReset}
                      size="lg"
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Start Over
                    </Button>
                    {/* <Button
                      onClick={handleStartQuiz}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start Quiz
                    </Button> */}
                  </div>
                </div>
              </CardHeader>
            </Card>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {viewMode === "display" && <QuizDisplay quizData={quizData} />}
              {viewMode === "grid" && <QuizDataGrid quizData={quizData} />}
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="w-[800px] flex flex-col">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Continue Chatting
                </CardTitle>
                <CardDescription>
                  Create more quizzes or ask questions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <QuizChat
                  onQuizGenerated={handleQuizGenerated}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                  setGenerationProgress={setGenerationProgress}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quiz Taker */}
      {quizSession && (
        <div className="max-w-4xl mx-auto p-6">
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
