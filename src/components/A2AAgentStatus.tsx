"use client";

import { useA2AServer } from "@/hooks/use-a2a-server";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export function A2AAgentStatus() {
  const { isInitialized, isStarting, error, serverStatus, restartServer } =
    useA2AServer();

  const getStatusIcon = () => {
    if (isStarting)
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    if (error) return <AlertCircle className="h-3 w-3 text-red-500" />;
    if (isInitialized)
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isStarting) return "Starting A2A Server...";
    if (error) return "A2A Server Error";
    if (isInitialized) return "A2A Agent Active";
    return "Initializing...";
  };

  const getStatusColor = () => {
    if (isStarting) return "text-blue-600";
    if (error) return "text-red-600";
    if (isInitialized) return "text-green-600";
    return "text-yellow-600";
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {serverStatus && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>Port: {serverStatus.port}</div>
            <div className="truncate">
              Agent Card: {serverStatus.agentCardUrl}
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={restartServer}
            disabled={isStarting}
            className="text-xs h-6 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Restart
          </Button>
        </div>
      </div>
    </div>
  );
}
