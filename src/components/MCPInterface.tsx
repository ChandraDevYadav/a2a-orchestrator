"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, User, Send, MessageSquare, BookOpen, Zap } from "lucide-react";

interface MCPMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
}

export function MCPInterface() {
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize chat
  useEffect(() => {
    addWelcomeMessage();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addWelcomeMessage = () => {
    const welcomeMessage: MCPMessage = {
      id: "welcome",
      type: "agent",
      content:
        "Hello, I am Quiz Agent! I can create quizzes from any topic or help you with general questions—just tell me what you need, and I'll assist you.",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: MCPMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Call orchestrator service to handle the query
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "handle_general_mcp_query",
          query: userMessage.content,
          context: {
            chatMode: "quiz", // Default to quiz mode for this interface
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        const agentResponse: MCPMessage = {
          id: (Date.now() + 1).toString(),
          type: "agent",
          content: result.response || result.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentResponse]);
      } else {
        throw new Error(result.error || "Failed to process query");
      }
    } catch (error) {
      console.error("MCP processing error:", error);

      // Fallback response with better error handling
      const fallbackResponse: MCPMessage = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: `I'm your Quiz Agent! I can help you create quizzes, but I'm currently having trouble connecting to the quiz generation service. 

**Don't worry! Here's what you can do:**

1. **Try a simpler request** - Ask for help with quiz topics or concepts
2. **Check if the backend service is running** - The quiz generation service might need to be started
3. **Ask me general questions** - I can still help with quiz planning and topics

**Example requests that work:**
• "Help me plan a science quiz about the solar system"
• "What topics should I include in a history quiz?"
• "Explain how to create good multiple choice questions"

What would you like to know about quiz creation?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "agent":
        return <Bot className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-100 border-blue-200";
      case "agent":
        return "bg-gray-100 border-gray-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hello, I am Quiz Agent!
          </h1>
          <p className="text-lg text-gray-600">
            I can create quizzes from any topic or help you with general
            questions—just tell me what you need, and I'll assist you.
          </p>
        </div>

        {/* Suggested Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button
            onClick={() => handleSuggestedAction("Create Quiz")}
            variant="outline"
            className="px-6 py-3 rounded-full text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
          >
            Create Quiz
          </Button>
          <Button
            onClick={() => handleSuggestedAction("Science Topics")}
            variant="outline"
            className="px-6 py-3 rounded-full text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
          >
            Science Topics
          </Button>
          <Button
            onClick={() => handleSuggestedAction("History Quiz")}
            variant="outline"
            className="px-6 py-3 rounded-full text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
          >
            History Quiz
          </Button>
          <Button
            onClick={() => handleSuggestedAction("Math Problems")}
            variant="outline"
            className="px-6 py-3 rounded-full text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
          >
            Math Problems
          </Button>
          <Button
            onClick={() => handleSuggestedAction("General Knowledge")}
            variant="outline"
            className="px-6 py-3 rounded-full text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
          >
            General Knowledge
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Messages */}
          <div className="h-96 overflow-y-auto mb-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 p-4 rounded-lg border ${getMessageColor(
                  message.type
                )}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field */}
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-h-[50px] resize-none border-gray-300 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isProcessing}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
      </div>
    </div>
  );
}
