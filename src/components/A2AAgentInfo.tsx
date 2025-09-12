"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { quizApiClient } from "@/lib/api-client";
import { Network, Server, Zap, Users } from "lucide-react";

interface AgentInfo {
  name: string;
  description: string;
  version: string;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
}

export function A2AAgentInfo() {
  const [backendAgent, setBackendAgent] = useState<AgentInfo | null>(null);
  const [frontendAgent] = useState<AgentInfo>({
    name: "Quiz Frontend Agent",
    description:
      "Interactive quiz frontend that provides user interface for quiz creation, display, and taking",
    version: "1.0.0",
    skills: [
      {
        id: "create_quiz_interface",
        name: "Create Quiz Interface",
        description:
          "Provides user interface for creating quizzes from text content",
        tags: ["quiz", "ui", "interface", "creation"],
      },
      {
        id: "display_quiz",
        name: "Display Quiz",
        description:
          "Renders quiz questions and answers in an interactive format",
        tags: ["quiz", "ui", "display", "interactive"],
      },
      {
        id: "take_quiz",
        name: "Take Quiz",
        description: "Provides interactive quiz-taking interface with scoring",
        tags: ["quiz", "ui", "interactive", "scoring"],
      },
      {
        id: "orchestrate_quiz_generation",
        name: "Orchestrate Quiz Generation",
        description:
          "Coordinates with backend quiz generation agents to create quizzes",
        tags: ["quiz", "orchestration", "coordination", "backend"],
      },
    ],
  });
  const [loading, setLoading] = useState(false);

  const loadBackendAgentInfo = async () => {
    setLoading(true);
    try {
      const agentCard = await quizApiClient.getBackendAgentInfo();
      setBackendAgent(agentCard);
    } catch (error) {
      console.error("Failed to load backend agent info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackendAgentInfo();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>A2A Agent Network</span>
          </CardTitle>
          <CardDescription>
            Agent2Agent Protocol integration status and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Frontend Agent */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Frontend Agent</span>
                <Badge variant="secondary">Port 3001</Badge>
              </h3>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {frontendAgent.description}
            </p>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Skills:</h4>
              <div className="flex flex-wrap gap-2">
                {frontendAgent.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Backend Agent */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span>Backend Agent</span>
                <Badge variant="secondary">Port 4001</Badge>
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={loadBackendAgentInfo}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            {backendAgent ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  {backendAgent.description}
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {backendAgent.skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 mt-2"
                >
                  Connected
                </Badge>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                Backend agent not available. Make sure it is running on port
                4001.
              </div>
            )}
          </div>

          {/* Protocol Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4" />
              <span>Protocol Information</span>
            </h4>
            <div className="text-sm space-y-1">
              <div>
                • Frontend Agent Card:{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  http://localhost:3001/.well-known/agent-card.json
                </code>
              </div>
              <div>
                • Backend Agent Card:{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  http://localhost:4001/.well-known/agent-card.json
                </code>
              </div>
              <div>• Communication: A2A Protocol (Agent-to-Agent)</div>
              <div>• Orchestration: Frontend can orchestrate Backend</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
