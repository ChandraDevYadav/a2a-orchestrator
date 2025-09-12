"use client";

import { useA2AServer } from "@/hooks/use-a2a-server";

export function A2AAgentStatus() {
  const { isInitialized } = useA2AServer();

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 dark:bg-blue-900 p-3 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isInitialized ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium">
          A2A Agent: {isInitialized ? "Active" : "Initializing..."}
        </span>
      </div>
      {isInitialized && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Port: 3001 | Card: /.well-known/agent-card.json
        </div>
      )}
    </div>
  );
}
