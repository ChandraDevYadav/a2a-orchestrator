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
        "Hello! I'm your AI Assistant. I can help you create quizzes from any topic or answer general questions. Just tell me what you need!",
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

  // Function to determine if input is a quiz request - be more specific
  const isQuizRequest = (userInput: string): boolean => {
    const lowerInput = userInput.toLowerCase();

    // More specific quiz request patterns
    const specificQuizPatterns = [
      "create a quiz",
      "generate a quiz",
      "make a quiz",
      "quiz about",
      "quiz on",
      "quiz for",
      "create quiz",
      "generate quiz",
      "make quiz",
      "create questions",
      "generate questions",
      "multiple choice questions",
      "quiz with",
    ];

    // Check for specific patterns first
    if (specificQuizPatterns.some((pattern) => lowerInput.includes(pattern))) {
      return true;
    }

    // Check for quiz + context words (more restrictive)
    if (
      lowerInput.includes("quiz") &&
      (lowerInput.includes("about") ||
        lowerInput.includes("on") ||
        lowerInput.includes("for") ||
        lowerInput.includes("with"))
    ) {
      return true;
    }

    // Check for question-related terms only if they're not standalone
    if (
      (lowerInput.includes("questions") ||
        lowerInput.includes("test") ||
        lowerInput.includes("exam")) &&
      (lowerInput.includes("create") ||
        lowerInput.includes("generate") ||
        lowerInput.includes("make"))
    ) {
      return true;
    }

    return false;
  };

  // Function to handle general chat responses
  const getGeneralResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    // Greeting responses
    if (
      lowerInput.includes("hello") ||
      lowerInput.includes("hi") ||
      lowerInput.includes("hey")
    ) {
      return "Hello! I'm your AI Assistant. I can help you create quizzes on any topic or answer general questions. What would you like to do today?";
    }

    // Help responses
    if (lowerInput.includes("help") || lowerInput.includes("what can you do")) {
      return "I can help you in two ways:\n\n1. **Create Quizzes**: Just ask me to 'create a quiz about [topic]' and I'll generate multiple-choice questions for you.\n\n2. **General Questions**: Ask me anything and I'll do my best to help!\n\nWhat would you like to try?";
    }

    // Thank you responses
    if (lowerInput.includes("thank") || lowerInput.includes("thanks")) {
      return "You're welcome! I'm here to help. Feel free to ask me to create a quiz about any topic or ask me any questions you have!";
    }

    // Default responses
    const responses = [
      "That's interesting! I'm here to help you create quizzes and answer questions. If you'd like me to create a quiz about this topic, just let me know!",
      "Great question! I can help you learn more about this by creating a quiz if you're interested, or I can try to answer your question directly.",
      "I understand! I'm here to help with quiz creation and general questions. What would you like to explore?",
      "That's a good point! If you'd like to test your knowledge on this topic, I can create a quiz for you, or I can help answer your question.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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
      // Check if this is a quiz request
      if (isQuizRequest(userInput)) {
        // Handle quiz generation
        let progressInterval: NodeJS.Timeout | null = null;
        let progressUpdateInterval: NodeJS.Timeout | null = null;

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

        // Update generation progress separately
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
      } else {
        // Handle general chat
        const response = getGeneralResponse(userInput);

        // Simulate typing delay
        setTimeout(() => {
          updateMessage(botMessageId, response, false);
        }, 1000);
      }
    } catch (error: any) {
      // Update bot message with error
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
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
            placeholder="Type a message... (e.g., 'Hello!' or 'Create a quiz about science')"
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
    </div>
  );
}
