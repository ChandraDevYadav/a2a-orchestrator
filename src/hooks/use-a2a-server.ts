"use client";

import { useEffect, useState } from "react";
import {
  startRealFrontendA2AServer,
  stopRealFrontendA2AServer,
  getRealFrontendA2AServer,
} from "@/lib/a2a-server-real-sdk";

/**
 * Hook to initialize real A2A server for the frontend
 * This makes the frontend a proper A2A agent with actual server endpoints
 */
export function useA2AServer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  useEffect(() => {
    const initializeA2AServer = async () => {
      try {
        // Only initialize on client side
        if (typeof window === "undefined") return;

        setIsStarting(true);
        setError(null);

        console.log("Starting Frontend A2A Agent...");

        // Start the A2A server using SDK
        const server = await startRealFrontendA2AServer();

        // Get server status
        const status = server.getStatus();
        setServerStatus(status);
        setIsInitialized(true);
        setIsStarting(false);

        console.log("Frontend A2A Agent initialized successfully!");
        console.log(`Agent Card: ${status.agentCardUrl}`);
        console.log(`Health Check: ${status.healthUrl}`);

        // Cleanup on unmount
        return () => {
          console.log("Stopping A2A server...");
          stopRealFrontendA2AServer();
        };
      } catch (error) {
        console.error("Failed to initialize A2A server:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setIsStarting(false);
        setIsInitialized(false);
      }
    };

    initializeA2AServer();
  }, []);

  const getServerStatus = () => {
    if (isInitialized && serverStatus) {
      return serverStatus;
    }
    return null;
  };

  const restartServer = async () => {
    try {
      setIsStarting(true);
      setError(null);

      // Stop existing server
      await stopRealFrontendA2AServer();

      // Start new server
      const server = await startRealFrontendA2AServer();
      const status = server.getStatus();
      setServerStatus(status);
      setIsInitialized(true);
      setIsStarting(false);

      console.log("A2A server restarted successfully");
    } catch (error) {
      console.error("Failed to restart A2A server:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setIsStarting(false);
    }
  };

  return {
    isInitialized,
    isStarting,
    error,
    serverStatus: getServerStatus(),
    restartServer,
  };
}
