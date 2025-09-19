"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ManualChatProps {
  onManualGenerated?: (manual: any) => void;
}

export function ManualChat({ onManualGenerated }: ManualChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your manual creation assistant. What topic would you like me to help you create a manual for?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "orchestrate-manual-workflow",
          topic: input.trim(),
          prompt: "",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      let assistantContent = "";

      if (result.status === "completed" && result.result?.data) {
        const manual = result.result.data;
        assistantContent = `I've generated a comprehensive manual for "${input.trim()}". Here's what I've created:\n\n`;

        if (manual.title) {
          assistantContent += `**Title:** ${manual.title}\n\n`;
        }

        if (manual.introduction?.purpose) {
          assistantContent += `**Purpose:** ${manual.introduction.purpose}\n\n`;
        }

        if (manual.sections && manual.sections.length > 0) {
          assistantContent += `**Sections:** ${manual.sections.length} sections covering:\n`;
          manual.sections.forEach((section: any, index: number) => {
            assistantContent += `- ${
              section.title || `Section ${index + 1}`
            }\n`;
          });
          assistantContent += "\n";
        }

        assistantContent +=
          "The manual is now ready! You can view the full content or ask me to modify any specific section.";

        // Store the manual data for potential use
        if (onManualGenerated) {
          onManualGenerated(manual);
        }
      } else {
        assistantContent =
          "I apologize, but I encountered an issue generating the manual. Please try again with a different topic or rephrase your request.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      toast({
        title: "Success",
        description: "Manual generated successfully!",
      });
    } catch (error) {
      console.error("Manual generation failed:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error while generating the manual. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to generate manual. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm your manual creation assistant. What topic would you like me to help you create a manual for?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      {/* <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              💬 Manual Chat Assistant
            </CardTitle>
            <CardDescription className="text-gray-900">
              Interactive manual creation with AI assistance
            </CardDescription>
          </div>
          <Button onClick={clearChat} variant="outline" size="sm">
            Clear Chat
          </Button>
        </div>
      </CardHeader> */}

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-1 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={message.role === "user" ? "secondary" : "outline"}
                    className="text-gray-900"
                  >
                    {message.role === "user" ? "You" : "Assistant"}
                  </Badge>
                  <span className="text-xs opacity-70 text-gray-600">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-900">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-gray-900">
                    Assistant
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary text-blue-600"></div>
                  Generating manual...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the manual you want to create..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-md text-gray-900 bg-white"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-md text-white bg-blue-600 hover:bg-blue-700 px-4 py-2"
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
