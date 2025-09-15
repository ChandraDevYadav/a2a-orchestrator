"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import {
  Network,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Clock,
  AlertCircle,
} from "lucide-react";

export function OrchestratorStatus() {
  const { status, isLoading, checkHealth, discoverAgents } = useOrchestrator();

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (status.isHealthy)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status.isConnected)
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = () => {
    if (status.isHealthy) return "bg-green-100 text-green-800 border-green-200";
    if (status.isConnected)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const formatLastChecked = () => {
    if (!status.lastChecked) return "Never";
    return status.lastChecked.toLocaleTimeString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="h-5 w-5" />
          Orchestrator Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Connection</span>
          </div>
          <Badge className={getStatusColor()}>
            {status.isHealthy
              ? "Healthy"
              : status.isConnected
              ? "Connected"
              : "Disconnected"}
          </Badge>
        </div>

        {/* Agents Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="font-medium">Agents</span>
          </div>
          <Badge variant="outline">{status.agents.length} online</Badge>
        </div>

        {/* Workflows Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="font-medium">Workflows</span>
          </div>
          <Badge variant="outline">{status.workflows.length} available</Badge>
        </div>

        {/* Last Checked */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Last Checked</span>
          </div>
          <span className="text-sm text-gray-600">{formatLastChecked()}</span>
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{status.error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={checkHealth}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Check Health
          </Button>
          <Button
            onClick={discoverAgents}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Server className="h-4 w-4 mr-2" />
            Discover Agents
          </Button>
        </div>

        {/* Agent List */}
        {status.agents.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="font-medium text-sm mb-2">Available Agents:</h4>
            <div className="space-y-1">
              {status.agents.map((agent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono">{agent.id}</span>
                  <Badge
                    variant="outline"
                    className={
                      agent.status === "online"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {agent.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
