"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Bot,
  User,
  Settings,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "orchestrator" | "agent" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    workflowId?: string;
    agentId?: string;
    skillId?: string;
    status?: string;
  };
}

interface OrchestratorChatProps {
  onQuizGenerated?: (data: any) => void;
  isGenerating?: boolean;
  setIsGenerating?: (isGenerating: boolean) => void;
  setGenerationProgress?: (progress: number) => void;
}

export function OrchestratorChat({
  onQuizGenerated,
  isGenerating = false,
  setIsGenerating = () => {},
  setGenerationProgress = () => {},
}: OrchestratorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orchestratorStatus, setOrchestratorStatus] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadOrchestratorData();
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadOrchestratorData = async () => {
    try {
      const [statusRes, agentsRes, workflowsRes] = await Promise.all([
        fetch("/api/orchestrator?action=status"),
        fetch("/api/orchestrator?action=agents"),
        fetch("/api/orchestrator?action=workflows"),
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setOrchestratorStatus(status);
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }
    } catch (error) {
      console.error("Failed to load orchestrator data:", error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/orchestrator?action=chat_history");
      if (response.ok) {
        const history = await response.json();
        setMessages(history);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Determine if this is a workflow request
      const isWorkflowRequest =
        input.toLowerCase().includes("quiz") ||
        input.toLowerCase().includes("generate") ||
        input.toLowerCase().includes("create");

      let response;

      if (isWorkflowRequest) {
        // Extract topic from user input
        const topic = input.trim();

        response = await fetch("/api/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "orchestrate_quiz_workflow",
            topic: topic,
            difficulty: "intermediate",
            question_count: 5,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Add orchestrator response
          const orchestratorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "orchestrator",
            content: `Workflow completed! Generated quiz for topic: "${topic}"`,
            timestamp: new Date(),
            metadata: {
              workflowId: result.workflow_id,
              status: "completed",
            },
          };

          setMessages((prev) => [...prev, orchestratorMessage]);

          // Trigger quiz generation callback if provided
          if (onQuizGenerated && result.result) {
            onQuizGenerated(result.result);
          }

          toast({
            title: "Success",
            description: `Quiz workflow completed successfully`,
          });
        }
      } else {
        // Handle other commands
        response = await fetch("/api/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "discover_agents",
            network_scan: true,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          const orchestratorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "orchestrator",
            content: `Discovered ${result.count} agents in the network`,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, orchestratorMessage]);
        }
      }

      // Reload orchestrator data
      await loadOrchestratorData();
      await loadChatHistory();
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_chat_history" }),
      });

      setMessages([]);

      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const discoverAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover_agents", network_scan: true }),
      });

      if (response.ok) {
        const result = await response.json();

        const message: ChatMessage = {
          id: Date.now().toString(),
          type: "orchestrator",
          content: `Agent discovery completed. Found ${result.count} agents.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, message]);
        await loadOrchestratorData();
      }
    } catch (error) {
      console.error("Failed to discover agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "orchestrator":
        return <Bot className="h-4 w-4" />;
      case "agent":
        return <Settings className="h-4 w-4" />;
      case "system":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-100 border-blue-200";
      case "orchestrator":
        return "bg-purple-100 border-purple-200";
      case "agent":
        return "bg-green-100 border-green-200";
      case "system":
        return "bg-gray-100 border-gray-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Orchestrator Chat
            </CardTitle>
            <CardDescription>
              Chat with the A2A Protocol Orchestrator
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={discoverAgents}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-1" />
              Discover
            </Button>
            <Button onClick={clearChat} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        {orchestratorStatus && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Orchestrator Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                Agents: {orchestratorStatus.agents?.active || 0}/
                {orchestratorStatus.agents?.discovered || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Workflows: {workflows.length}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with the orchestrator</p>
              <p className="text-sm">
                Try: "Generate a quiz about machine learning"
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 p-3 rounded-lg border ${getMessageColor(
                  message.type
                )}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm capitalize">
                      {message.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.metadata?.workflowId && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.workflowId}
                      </Badge>
                    )}
                    {message.metadata?.status && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          message.metadata.status === "completed"
                            ? "bg-green-100"
                            : message.metadata.status === "failed"
                            ? "bg-red-100"
                            : message.metadata.status === "running"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {message.metadata.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (e.g., 'Generate a quiz about AI')"
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
