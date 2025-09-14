"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  BookOpen,
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
}

interface SimpleChatInterfaceProps {
  onQuizGenerated?: (data: any) => void;
  isGenerating?: boolean;
  setIsGenerating?: (isGenerating: boolean) => void;
  setGenerationProgress?: (progress: number) => void;
}

export function SimpleChatInterface({
  onQuizGenerated,
  isGenerating = false,
  setIsGenerating = () => {},
  setGenerationProgress = () => {},
}: SimpleChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello, I am Quiz Agent! I can create quizzes from any topic or help you with general questions—just tell me what you need, and I'll assist you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested topics/chips
  const suggestedTopics = [
    "Create Quiz",
    "Science Topics",
    "History Quiz",
    "Math Problems",
    "General Knowledge",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessageId = addMessage("user", userInput);

    // Clear input
    setInput("");

    // Add bot thinking message
    const botMessageId = addMessage("bot", "", true);

    setIsLoading(true);
    setIsGenerating(true);

    try {
      // Determine if this is a quiz request - be more specific
      const lowerInput = userInput.toLowerCase();
      const isQuizRequest =
        lowerInput.includes("create a quiz") ||
        lowerInput.includes("generate a quiz") ||
        lowerInput.includes("make a quiz") ||
        lowerInput.includes("quiz about") ||
        lowerInput.includes("quiz on") ||
        lowerInput.includes("quiz for") ||
        lowerInput.includes("create quiz") ||
        lowerInput.includes("generate quiz") ||
        lowerInput.includes("make quiz") ||
        lowerInput.includes("create questions") ||
        lowerInput.includes("generate questions") ||
        (lowerInput.includes("quiz") &&
          (lowerInput.includes("about") ||
            lowerInput.includes("on") ||
            lowerInput.includes("for")));

      if (isQuizRequest) {
        // Handle quiz generation
        const response = await fetch("/api/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "orchestrate_quiz_workflow",
            topic: userInput,
            difficulty: "intermediate",
            question_count: 5,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          updateMessage(
            botMessageId,
            `Great! I've created a quiz about "${userInput}" with ${
              result.result?.length || 5
            } questions. The quiz is ready for you to take!`,
            false
          );

          // Trigger quiz generation callback if provided
          if (onQuizGenerated && result.result) {
            setTimeout(() => {
              onQuizGenerated(result.result);
            }, 1000);
          }
        } else {
          updateMessage(
            botMessageId,
            "I apologize, but I encountered an error while creating your quiz. Please try again with a different topic.",
            false
          );
        }
      } else {
        // Handle general chat
        let response = "";

        // Check for greetings
        if (
          lowerInput.includes("hello") ||
          lowerInput.includes("hi") ||
          lowerInput.includes("hey")
        ) {
          response =
            "Hello! I'm your Quiz Agent. I can help you create quizzes on any topic or answer general questions. What would you like to do today?";
        } else if (
          lowerInput.includes("help") ||
          lowerInput.includes("what can you do")
        ) {
          response =
            "I can help you in two ways:\n\n1. **Create Quizzes**: Just ask me to 'create a quiz about [topic]' and I'll generate multiple-choice questions for you.\n\n2. **General Questions**: Ask me anything and I'll do my best to help!\n\nWhat would you like to try?";
        } else if (lowerInput.includes("thank")) {
          response =
            "You're welcome! I'm here to help. Feel free to ask me to create a quiz about any topic or ask me any questions you have!";
        } else {
          // General responses for other questions
          const responses = [
            "That's an interesting question! I'm here to help you create quizzes and answer questions about various topics.",
            "I'd be happy to help! If you'd like me to create a quiz about this topic, just let me know.",
            "Great question! I can create educational quizzes on this subject if you're interested.",
            "I understand! Feel free to ask me to create a quiz about any topic you'd like to learn more about.",
          ];
          response = responses[Math.floor(Math.random() * responses.length)];
        }

        // Simulate typing delay
        setTimeout(() => {
          updateMessage(botMessageId, response, false);
        }, 1000);
      }
    } catch (error) {
      updateMessage(
        botMessageId,
        "I apologize, but I encountered an error. Please try again.",
        false
      );
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    if (topic === "Create Quiz") {
      setInput("Create a quiz about ");
    } else {
      setInput(`Create a quiz about ${topic.toLowerCase()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hello, I am Quiz Agent!
        </h1>
        <p className="text-gray-600 text-lg">
          I can create quizzes from any topic or help you with general
          questions—just tell me what you need, and I'll assist you.
        </p>
      </div>

      {/* Suggested Topics */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {suggestedTopics.map((topic, index) => (
          <Button
            key={index}
            variant="outline"
            className="rounded-full px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300"
            onClick={() => handleTopicClick(topic)}
          >
            {topic}
          </Button>
        ))}
      </div>

      {/* Chat Messages */}
      <Card className="mb-6 max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
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
      </Card>

      {/* Input Area */}
      <div className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 h-12 text-lg"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="lg"
          className="h-12 px-6"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Agent Online</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Chat Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Quiz Creation</span>
        </div>
      </div>
    </div>
  );
}
