"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quizApiClient } from "@/lib/api-client";
import { Settings, Network, Globe, RefreshCw } from "lucide-react";

export function A2AConfiguration() {
  const [useA2A, setUseA2A] = useState(true);
  const [useRealA2A, setUseRealA2A] = useState(true);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedUseA2A = localStorage.getItem("useA2A") !== "false";
    const savedUseRealA2A = localStorage.getItem("useRealA2A") !== "false";

    setUseA2A(savedUseA2A);
    setUseRealA2A(savedUseRealA2A);

    // Apply settings to API client
    quizApiClient.setUseA2A(savedUseA2A);
    quizApiClient.setUseRealA2A(savedUseRealA2A);
  }, []);

  const handleUseA2AToggle = (value: boolean) => {
    setUseA2A(value);
    localStorage.setItem("useA2A", value.toString());
    quizApiClient.setUseA2A(value);
  };

  const handleUseRealA2AToggle = (value: boolean) => {
    setUseRealA2A(value);
    localStorage.setItem("useRealA2A", value.toString());
    quizApiClient.setUseRealA2A(value);
  };

  const checkBackendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const health = await quizApiClient.checkHealth();
      setBackendHealth(health);
    } catch (error) {
      setBackendHealth({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const checkFrontendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch("http://localhost:3000/api/health");
      const health = await response.json();
      setBackendHealth(health);
    } catch (error) {
      setBackendHealth({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const getProtocolDescription = () => {
    if (!useA2A) return "REST API - Direct HTTP calls to backend";
    if (useRealA2A)
      return "Real A2A Protocol - Full agent-to-agent communication";
    return "Simulated A2A - A2A-style requests over HTTP";
  };

  const getProtocolIcon = () => {
    if (!useA2A) return <Globe className="h-4 w-4" />;
    return <Network className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          A2A Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Use A2A Protocol</label>
            <Button
              size="sm"
              variant={useA2A ? "default" : "outline"}
              onClick={() => handleUseA2AToggle(!useA2A)}
            >
              {useA2A ? "ON" : "OFF"}
            </Button>
          </div>

          {useA2A && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Real A2A Protocol</label>
              <Button
                size="sm"
                variant={useRealA2A ? "default" : "outline"}
                onClick={() => handleUseRealA2AToggle(!useRealA2A)}
              >
                {useRealA2A ? "ON" : "OFF"}
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium mb-1">
            {getProtocolIcon()}
            Current Protocol
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getProtocolDescription()}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Backend Health</span>
            <Button
              size="sm"
              variant="outline"
              onClick={checkBackendHealth}
              disabled={isCheckingHealth}
            >
              {isCheckingHealth ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Frontend Health</span>
            <Button
              size="sm"
              variant="outline"
              onClick={checkFrontendHealth}
              disabled={isCheckingHealth}
            >
              {isCheckingHealth ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>

          {backendHealth && (
            <div
              className={`p-2 rounded text-xs ${
                backendHealth.status === "ok"
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              <div className="font-medium">Status: {backendHealth.status}</div>
              {backendHealth.agent && <div>Agent: {backendHealth.agent}</div>}
              {backendHealth.message && (
                <div>Message: {backendHealth.message}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
