"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { quizApiClient } from "@/lib/enhanced-api-client";
import { Settings, Save, RefreshCw } from "lucide-react";

export function OrchestratorConfiguration() {
  const [config, setConfig] = useState({
    orchestratorUrl: "local", // Using integrated orchestrator
    backendUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001",
    useOrchestrator: true,
    useA2A: true,
    useRealA2A: true,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    orchestrator: boolean | null;
    backend: boolean | null;
    error: string | null;
  }>({
    orchestrator: null,
    backend: null,
    error: null,
  });

  const testConnection = async (
    url: string,
    type: "orchestrator" | "backend"
  ) => {
    try {
      if (type === "orchestrator" && url === "local") {
        // Test local integrated orchestrator
        const response = await fetch("/api/orchestrator?action=health");
        if (response.ok) {
          setTestResults((prev) => ({
            ...prev,
            orchestrator: true,
            error: null,
          }));
          return true;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        // Test external services
        const endpoint = type === "orchestrator" ? "/health" : "/health";
        const response = await fetch(`${url}${endpoint}`);

        if (response.ok) {
          setTestResults((prev) => ({
            ...prev,
            [type]: true,
            error: null,
          }));
          return true;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [type]: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
      return false;
    }
  };

  const testAllConnections = async () => {
    setIsTesting(true);
    setTestResults({
      orchestrator: null,
      backend: null,
      error: null,
    });

    try {
      await Promise.all([
        testConnection(config.orchestratorUrl, "orchestrator"),
        testConnection(config.backendUrl, "backend"),
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = () => {
    // Update the API client configuration
    quizApiClient.setUseOrchestrator(config.useOrchestrator);
    quizApiClient.setUseA2A(config.useA2A);
    quizApiClient.setUseRealA2A(config.useRealA2A);

    // Store in localStorage for persistence
    localStorage.setItem("orchestrator-config", JSON.stringify(config));

    console.log("Configuration saved:", config);
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem("orchestrator-config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to load saved configuration:", error);
      }
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Orchestrator Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URLs Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orchestrator-url">Orchestrator URL</Label>
            <Input
              id="orchestrator-url"
              value={config.orchestratorUrl}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  orchestratorUrl: e.target.value,
                }))
              }
              placeholder="local (integrated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backend-url">Backend URL</Label>
            <Input
              id="backend-url"
              value={config.backendUrl}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, backendUrl: e.target.value }))
              }
              placeholder="http://localhost:4001"
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="use-orchestrator">Use Orchestrator</Label>
            <Switch
              id="use-orchestrator"
              checked={config.useOrchestrator}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, useOrchestrator: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="use-a2a">Use A2A Protocol</Label>
            <Switch
              id="use-a2a"
              checked={config.useA2A}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, useA2A: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="use-real-a2a">Use Real A2A</Label>
            <Switch
              id="use-real-a2a"
              checked={config.useRealA2A}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, useRealA2A: checked }))
              }
            />
          </div>
        </div>

        {/* Connection Test Results */}
        {testResults.orchestrator !== null && (
          <div className="space-y-2">
            <h4 className="font-medium">Connection Test Results:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">Orchestrator:</span>
                {testResults.orchestrator ? (
                  <span className="text-green-600 text-sm">✅ Connected</span>
                ) : (
                  <span className="text-red-600 text-sm">❌ Failed</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Backend:</span>
                {testResults.backend ? (
                  <span className="text-green-600 text-sm">✅ Connected</span>
                ) : (
                  <span className="text-red-600 text-sm">❌ Failed</span>
                )}
              </div>
            </div>
            {testResults.error && (
              <div className="text-red-600 text-sm">
                Error: {testResults.error}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={testAllConnections}
            disabled={isTesting}
            variant="outline"
            className="flex-1"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connections
          </Button>
          <Button onClick={saveConfiguration} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Config
          </Button>
        </div>

        {/* Current Configuration Display */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Current Configuration:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Orchestrator: {config.useOrchestrator ? "✅" : "❌"}</div>
            <div>A2A Protocol: {config.useA2A ? "✅" : "❌"}</div>
            <div>Real A2A: {config.useRealA2A ? "✅" : "❌"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
