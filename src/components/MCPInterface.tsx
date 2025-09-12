"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  User,
  Send,
  Settings,
  Zap,
  BookOpen,
  Trophy,
  Lightbulb,
  MessageSquare,
  Workflow,
  Network,
  Wrench,
} from "lucide-react";

interface MCPMessage {
  id: string;
  type: "user" | "agent" | "tool" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    toolUsed?: string;
    agentId?: string;
    workflowId?: string;
    status?: string;
  };
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "content" | "analysis" | "generation" | "management";
}

interface MCPAgent {
  id: string;
  name: string;
  description: string;
  status: "online" | "offline" | "busy";
  capabilities: string[];
}

export function MCPInterface() {
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [agents, setAgents] = useState<MCPAgent[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize MCP tools and agents
  useEffect(() => {
    initializeMCPTools();
    initializeMCPAgents();
    addWelcomeMessage();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update word count
  useEffect(() => {
    setWordCount(
      input
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    );
  }, [input]);

  const initializeMCPTools = () => {
    const mcpTools: MCPTool[] = [
      {
        id: "content-analyzer",
        name: "Content Analyzer",
        description: "Analyzes text content and extracts key concepts",
        icon: <BookOpen className="h-4 w-4" />,
        category: "analysis",
      },
      {
        id: "quiz-generator",
        name: "Quiz Generator",
        description: "Generates comprehensive multiple-choice questions",
        icon: <Trophy className="h-4 w-4" />,
        category: "generation",
      },
      {
        id: "ai-assistant",
        name: "AI Assistant",
        description: "Provides intelligent content processing and insights",
        icon: <Lightbulb className="h-4 w-4" />,
        category: "content",
      },
      {
        id: "workflow-manager",
        name: "Workflow Manager",
        description: "Orchestrates complex multi-step processes",
        icon: <Workflow className="h-4 w-4" />,
        category: "management",
      },
    ];
    setTools(mcpTools);
  };

  const initializeMCPAgents = () => {
    const mcpAgents: MCPAgent[] = [
      {
        id: "quiz-agent",
        name: "Quiz Generation Agent",
        description: "Specialized in creating educational content and quizzes",
        status: "online",
        capabilities: [
          "quiz-generation",
          "content-analysis",
          "educational-design",
        ],
      },
      {
        id: "orchestrator-agent",
        name: "Orchestrator Agent",
        description: "Coordinates workflows and manages agent communication",
        status: "online",
        capabilities: [
          "workflow-management",
          "agent-coordination",
          "task-orchestration",
        ],
      },
      {
        id: "analysis-agent",
        name: "Content Analysis Agent",
        description: "Analyzes and processes text content for insights",
        status: "online",
        capabilities: [
          "text-analysis",
          "concept-extraction",
          "content-summarization",
        ],
      },
    ];
    setAgents(mcpAgents);
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: MCPMessage = {
      id: "welcome",
      type: "agent",
      content:
        "Hello! I'm your MCP-enabled AI Assistant. I can help you with content analysis, quiz generation, and workflow orchestration. I have access to multiple tools and agents to assist you. What would you like to do today?",
      timestamp: new Date(),
      metadata: {
        agentId: "orchestrator-agent",
        status: "ready",
      },
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
      // Determine which tool/agent to use based on input
      const toolToUse = determineToolToUse(input);
      const agentToUse = determineAgentToUse(input);

      // Add tool usage message
      if (toolToUse) {
        const toolMessage: MCPMessage = {
          id: (Date.now() + 1).toString(),
          type: "tool",
          content: `Using ${toolToUse.name} to process your request...`,
          timestamp: new Date(),
          metadata: {
            toolUsed: toolToUse.id,
            status: "processing",
          },
        };
        setMessages((prev) => [...prev, toolMessage]);
      }

      // Simulate MCP processing
      await simulateMCPProcessing(userMessage, toolToUse, agentToUse);
    } catch (error) {
      console.error("MCP processing error:", error);

      const errorMessage: MCPMessage = {
        id: (Date.now() + 2).toString(),
        type: "system",
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
        metadata: { status: "error" },
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const determineToolToUse = (input: string): MCPTool | null => {
    const lowerInput = input.toLowerCase();

    if (
      lowerInput.includes("quiz") ||
      lowerInput.includes("question") ||
      lowerInput.includes("test")
    ) {
      return tools.find((t) => t.id === "quiz-generator") || null;
    }
    if (
      lowerInput.includes("analyze") ||
      lowerInput.includes("extract") ||
      lowerInput.includes("concept")
    ) {
      return tools.find((t) => t.id === "content-analyzer") || null;
    }
    if (
      lowerInput.includes("workflow") ||
      lowerInput.includes("orchestrate") ||
      lowerInput.includes("manage")
    ) {
      return tools.find((t) => t.id === "workflow-manager") || null;
    }

    return tools.find((t) => t.id === "ai-assistant") || null;
  };

  const determineAgentToUse = (input: string): MCPAgent | null => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("quiz") || lowerInput.includes("question")) {
      return agents.find((a) => a.id === "quiz-agent") || null;
    }
    if (lowerInput.includes("workflow") || lowerInput.includes("orchestrate")) {
      return agents.find((a) => a.id === "orchestrator-agent") || null;
    }
    if (lowerInput.includes("analyze") || lowerInput.includes("content")) {
      return agents.find((a) => a.id === "analysis-agent") || null;
    }

    return agents.find((a) => a.id === "orchestrator-agent") || null;
  };

  const simulateMCPProcessing = async (
    userMessage: MCPMessage,
    tool: MCPTool | null,
    agent: MCPAgent | null
  ) => {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let responseContent = "";

    if (tool && agent) {
      responseContent = `I've processed your request using the ${tool.name} tool and coordinated with the ${agent.name}. `;

      if (tool.id === "quiz-generator") {
        responseContent += `I've analyzed your content and generated 20 high-quality multiple-choice questions covering the key concepts. The quiz is ready for you to take!`;
      } else if (tool.id === "content-analyzer") {
        responseContent += `I've analyzed your content and extracted the main concepts, key points, and important information. Here's what I found: [Analysis results would be displayed here]`;
      } else if (tool.id === "workflow-manager") {
        responseContent += `I've orchestrated a workflow to handle your request. The process involves multiple steps and agent coordination.`;
      } else {
        responseContent += `I've processed your request using AI-powered analysis and provided intelligent insights.`;
      }
    } else {
      responseContent = `I understand your request. I can help you with content analysis, quiz generation, workflow orchestration, or general AI assistance. What specific task would you like me to help you with?`;
    }

    const agentResponse: MCPMessage = {
      id: (Date.now() + 3).toString(),
      type: "agent",
      content: responseContent,
      timestamp: new Date(),
      metadata: {
        toolUsed: tool?.id,
        agentId: agent?.id,
        status: "completed",
      },
    };

    setMessages((prev) => [...prev, agentResponse]);

    toast({
      title: "Success",
      description: "MCP request processed successfully",
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "agent":
        return <Bot className="h-4 w-4" />;
      case "tool":
        return <Wrench className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case "user":
        return "bg-blue-100 border-blue-200";
      case "agent":
        return "bg-purple-100 border-purple-200";
      case "tool":
        return "bg-green-100 border-green-200";
      case "system":
        return "bg-gray-100 border-gray-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const getToolColor = (category: string) => {
    switch (category) {
      case "content":
        return "bg-blue-100 text-blue-800";
      case "analysis":
        return "bg-green-100 text-green-800";
      case "generation":
        return "bg-purple-100 text-purple-800";
      case "management":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Left Panel - MCP Tools & Agents */}
      <div className="w-1/3 space-y-6">
        {/* MCP Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              MCP Tools
            </CardTitle>
            <CardDescription>
              Available tools for content processing and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTool === tool.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  setSelectedTool(selectedTool === tool.id ? null : tool.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${getToolColor(
                      tool.category
                    )}`}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{tool.name}</h4>
                    <p className="text-xs text-gray-600">{tool.description}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {tool.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* MCP Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              MCP Agents
            </CardTitle>
            <CardDescription>
              Available agents for task coordination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      agent.status === "online"
                        ? "bg-green-500"
                        : agent.status === "busy"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{agent.name}</h4>
                    <p className="text-xs text-gray-600">{agent.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.capabilities.slice(0, 2).map((capability) => (
                        <Badge
                          key={capability}
                          variant="outline"
                          className="text-xs"
                        >
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - MCP Chat Interface */}
      <div className="flex-1">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              MCP Assistant
            </CardTitle>
            <CardDescription>
              Interact with AI agents through Message Control Protocol
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
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
                      {message.metadata?.toolUsed && (
                        <Badge variant="outline" className="text-xs">
                          {message.metadata.toolUsed}
                        </Badge>
                      )}
                      {message.metadata?.agentId && (
                        <Badge variant="outline" className="text-xs">
                          {message.metadata.agentId}
                        </Badge>
                      )}
                      {message.metadata?.status && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            message.metadata.status === "completed"
                              ? "bg-green-100"
                              : message.metadata.status === "processing"
                              ? "bg-blue-100"
                              : message.metadata.status === "error"
                              ? "bg-red-100"
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
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you'd like to do... (e.g., 'Analyze this content and generate a quiz', 'Create a workflow for content processing')"
                  className="flex-1 min-h-[80px] resize-none"
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
                  className="self-end"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {wordCount} words • Max: 10,000 words
                </div>
                {selectedTool && (
                  <Badge variant="outline" className="text-xs">
                    Using: {tools.find((t) => t.id === selectedTool)?.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
