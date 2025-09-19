"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quizApiClient } from "@/lib/enhanced-api-client";
import { QuizData } from "@/types/quiz";
import { Send, FileText, Bot, User, Loader2 } from "lucide-react";
import {
  deepSeekChatAgent,
  DeepSeekChatMessage,
} from "@/lib/deepseek-chat-agent";

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
      content: "Hello! I'm your AI Assistant.",
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

  // Function to determine if input is a quiz request using DeepSeek AI
  const isQuizRequest = async (userInput: string): Promise<boolean> => {
    try {
      // Use DeepSeek AI to classify if this is a quiz request
      return await deepSeekChatAgent.isQuizRequest(userInput);
    } catch (error) {
      console.error("Error classifying quiz request:", error);
      // Fallback to simple pattern matching
      const lowerInput = userInput.toLowerCase();
      return (
        (lowerInput.includes("create") && lowerInput.includes("quiz")) ||
        (lowerInput.includes("generate") && lowerInput.includes("quiz")) ||
        (lowerInput.includes("make") && lowerInput.includes("quiz")) ||
        lowerInput.includes("quiz about") ||
        lowerInput.includes("quiz on")
      );
    }
  };

  // Function to handle general chat responses using DeepSeek AI
  const getGeneralResponse = async (userInput: string): Promise<string> => {
    try {
      // Convert chat history to DeepSeek format
      const chatHistory: DeepSeekChatMessage[] = messages
        .filter((msg) => msg.type !== "system")
        .slice(-10) // Keep last 10 messages for context
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      // Use DeepSeek AI to generate response
      const response = await deepSeekChatAgent.generateResponse(
        userInput,
        chatHistory
      );
      return response.content;
    } catch (error) {
      console.error("Error generating DeepSeek response:", error);

      // Fallback to simple responses
      const lowerInput = userInput.toLowerCase();

      if (
        lowerInput.includes("hello") ||
        lowerInput.includes("hi") ||
        lowerInput.includes("hey")
      ) {
        return "Hello! I'm your AI Assistant. I can help you create quizzes on any topic or answer general questions. What would you like to do today?";
      }

      if (
        lowerInput.includes("help") ||
        lowerInput.includes("what can you do")
      ) {
        return "I can help you in two ways:\n\n1. **Create Quizzes**: Just ask me to 'create a quiz about [topic]' and I'll generate multiple-choice questions for you.\n\n2. **General Questions**: Ask me anything and I'll do my best to help!\n\nWhat would you like to try?";
      }

      return "I'm here to help! I can answer questions or help you create quizzes. What would you like to know?";
    }
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

    try {
      // Send ALL requests to Orchestrator for centralized decision making
      console.log(
        "🎯 Sending request to Orchestrator for centralized decision..."
      );

      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "handle_centralized_request",
          query: userInput,
          context: {
            chatMode: "mixed",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Orchestrator response:", result);

      // Handle the response based on type
      if (result.type === "quiz") {
        // Quiz generation completed
        const quizQuestions = result.result?.data?.quiz_questions || [];
        const questionCount = Array.isArray(quizQuestions)
          ? quizQuestions.length
          : 0;

        updateMessage(
          botMessageId,
          `Great! I've successfully generated a quiz with ${questionCount} multiple-choice questions from your content. The quiz is now ready for you to review and take!`,
          false
        );

        // Small delay to show completion
        setTimeout(() => {
          if (result.result?.data && result.result.data.quiz_questions) {
            onQuizGenerated(result.result.data);
          }
        }, 500);
      } else if (result.type === "chat") {
        // General chat response
        updateMessage(botMessageId, result.response, false);
      } else if (result.type === "error") {
        // Error response
        updateMessage(botMessageId, result.response, false);
      } else {
        // Fallback response
        updateMessage(
          botMessageId,
          "I'm here to help! What would you like to know?",
          false
        );
      }
    } catch (error: any) {
      console.error("Orchestrator request failed:", error);

      // Fallback to simple response
      updateMessage(
        botMessageId,
        `I apologize, but I encountered an error: ${
          error.message || "Unknown error"
        }. Please try again.`,
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pb-4 px-4 pt-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="text-lg font-semibold">AI Assistant</span>
        </div>
      </div>

      {/* Messages Area - Takes remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 space-y-4">
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
                  ? "bg-blue-600 text-white rounded-[16px]"
                  : "bg-gray-100 text-gray-900 rounded-[16px]"
              }`}
            >
              {message.isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

      {/* Input Area - Fixed at bottom */}
      <div className="border-t p-4 space-y-3 flex-shrink-0 bg-white mt-auto">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[80px] resize-none scrollbar-hide border-gray-200 text-gray-900 rounded-md"
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
              <Send className="h-5 w-5 text-blue-600" />
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
    </div>
  );
}
