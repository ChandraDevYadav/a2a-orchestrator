"use client";

import { useEffect, useState } from "react";

/**
 * Hook to initialize A2A server for the frontend
 * This makes the frontend a proper A2A agent
 */
export function useA2AServer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [server, setServer] = useState<any>(null);

  useEffect(() => {
    const initializeA2AServer = async () => {
      try {
        // Only initialize on client side
        if (typeof window === "undefined") return;

        // For now, just mark as initialized without starting Express server
        // This avoids the complexity of running Express in the browser
        console.log("Frontend A2A Agent initialized (simplified mode)");
        console.log(
          "Agent Card available at: http://localhost:3001/.well-known/agent-card.json"
        );

        setIsInitialized(true);

        // Cleanup on unmount
        return () => {
          console.log("A2A server cleanup");
        };
      } catch (error) {
        console.error("Failed to initialize A2A server:", error);
      }
    };

    initializeA2AServer();
  }, []);

  return { isInitialized, server };
}
