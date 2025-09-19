"use client";

import { useState, useEffect } from "react";
import { orchestratorClient } from "@/lib/orchestrator-client";

export interface OrchestratorStatus {
  isConnected: boolean;
  isHealthy: boolean;
  agents: any[];
  workflows: any[];
  lastChecked: Date | null;
  error: string | null;
}

export function useOrchestrator() {
  const [status, setStatus] = useState<OrchestratorStatus>({
    isConnected: false,
    isHealthy: false,
    agents: [],
    workflows: [],
    lastChecked: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const health = (await orchestratorClient.checkHealth()) as {
        status: string;
      };
      const agents = (await orchestratorClient.getAllAgents()) as any[];
      const workflows = (await orchestratorClient.getAllWorkflows()) as any[];

      setStatus({
        isConnected: true,
        isHealthy: health.status === "healthy",
        agents: agents || [],
        workflows: workflows || [],
        lastChecked: new Date(),
        error: null,
      });
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        isHealthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const discoverAgents = async () => {
    setIsLoading(true);
    try {
      const result = await orchestratorClient.discoverAgents();
      setStatus((prev) => ({
        ...prev,
        agents: result.agents || [],
        lastChecked: new Date(),
        error: null,
      }));
      return result;
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Discovery failed",
        lastChecked: new Date(),
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const executeWorkflow = async (query: string, context?: any) => {
    setIsLoading(true);
    try {
      const result = await orchestratorClient.orchestrateQuizWorkflow({
        query,
        context: context || {},
      });

      setStatus((prev) => ({
        ...prev,
        lastChecked: new Date(),
        error: null,
      }));

      return result;
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Workflow execution failed",
        lastChecked: new Date(),
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const executeAgent = async (query: string, context?: any) => {
    setIsLoading(true);
    try {
      const result = await orchestratorClient.executeAgentWithResilience(
        query,
        context
      );

      setStatus((prev) => ({
        ...prev,
        lastChecked: new Date(),
        error: null,
      }));

      return result;
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Agent execution failed",
        lastChecked: new Date(),
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check health on mount
  useEffect(() => {
    checkHealth();

    // Set up periodic health checks
    const interval = setInterval(checkHealth, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isLoading,
    checkHealth,
    discoverAgents,
    executeWorkflow,
    executeAgent,
  };
}
