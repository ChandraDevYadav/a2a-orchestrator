"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quizApiClient } from "@/lib/api-client";
import { QuizData } from "@/types/quiz";
import { Send, FileText, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
}

interface QuizChatProps {
  onQuizGenerated: (data: QuizData) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
}

export function QuizChat({
  onQuizGenerated,
  isGenerating,
  setIsGenerating,
  setGenerationProgress,
}: QuizChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I'm your MCP-enabled AI Assistant. I can help you create quizzes from any text content using advanced tools and agent coordination. Just paste your content below and I'll generate 20 multiple-choice questions for you!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (value: string) => {
    setInput(value);
    const words = value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    setWordCount(words);
  };

  const addMessage = (
    type: ChatMessage["type"],
    content: string,
    isGenerating = false
  ) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      isGenerating,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, content: string, isGenerating = false) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content, isGenerating } : msg
      )
    );
  };

  const handleSend = async () => {
    if (!input.trim() || wordCount > 10000 || isGenerating) return;

    const userInput = input.trim();
    const userMessageId = addMessage("user", userInput);

    // Clear input
    setInput("");
    setWordCount(0);

    // Add bot thinking message
    const botMessageId = addMessage("bot", "", true);

    setIsGenerating(true);
    setProgress(0);
    setGenerationProgress(0);

    // Declare intervals outside try block for proper scope
    let progressInterval: NodeJS.Timeout | null = null;
    let progressUpdateInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev >= 90 ? 90 : prev + Math.random() * 15;
          if (prev >= 90 && progressInterval) {
            clearInterval(progressInterval);
          }
          return newProgress;
        });
      }, 500);

      // Update generation progress separately to avoid setState during render
      let currentProgress = 0;
      progressUpdateInterval = setInterval(() => {
        currentProgress =
          currentProgress >= 90 ? 90 : currentProgress + Math.random() * 15;
        setGenerationProgress(currentProgress);
        if (currentProgress >= 90 && progressUpdateInterval) {
          clearInterval(progressUpdateInterval);
        }
      }, 500);

      const response = await quizApiClient.generateQuiz(userInput);

      if (progressInterval) clearInterval(progressInterval);
      if (progressUpdateInterval) clearInterval(progressUpdateInterval);
      setProgress(100);
      setGenerationProgress(100);

      // Update bot message with success
      updateMessage(
        botMessageId,
        `Great! I've successfully generated a quiz with ${response.data.quiz_questions.length} multiple-choice questions from your content. The quiz is now ready for you to review and take!`,
        false
      );

      // Small delay to show completion
      setTimeout(() => {
        onQuizGenerated(response.data);
      }, 500);
    } catch (error: any) {
      // Clear intervals on error
      if (progressInterval) clearInterval(progressInterval);
      if (progressUpdateInterval) clearInterval(progressUpdateInterval);

      // Update bot message with error
      updateMessage(
        botMessageId,
        `I apologize, but I encountered an error while generating your quiz: ${
          error.message || "Unknown error"
        }. Please try again with different content.`,
        false
      );
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setGenerationProgress(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          MCP Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type !== "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white h-16 overflow-y-scroll scrollbar-hide"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating quiz...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </div>
              {message.type === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Paste your text content here... (e.g., lecture notes, articles, documentation, etc.)"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none scrollbar-hide"
              disabled={isGenerating}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || wordCount > 10000 || isGenerating}
              size="icon"
              className="self-end"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{wordCount} words</span>
            <span className={wordCount > 10000 ? "text-red-500" : ""}>
              Max: 10,000 words
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
