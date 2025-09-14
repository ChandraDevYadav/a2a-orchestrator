"use client";

import {
  QuizData,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "@/types/quiz";

/**
 * Browser-Compatible A2A Client
 * Provides A2A protocol communication with SSR safety
 */
export class QuizA2AClient {
  private backendAgentUrl: string;
  private isClientSide: boolean = false;

  constructor(backendAgentUrl: string = "http://localhost:4001") {
    this.backendAgentUrl = backendAgentUrl;

    // Check if we're on the client side
    if (typeof window !== "undefined") {
      this.isClientSide = true;
    }
  }

  /**
   * Generate quiz using A2A protocol with REST fallback
   */
  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    try {
      console.log("Starting quiz generation...");

      if (this.isClientSide) {
        // Try A2A protocol first on client side
        try {
          return await this.generateQuizWithA2A(input);
        } catch (a2aError) {
          console.log("A2A failed, falling back to REST:", a2aError);
          return await this.generateQuizWithREST(input);
        }
      } else {
        // Server side - use REST API
        return await this.generateQuizWithREST(input);
      }
    } catch (error) {
      console.error("Quiz generation failed:", error);
      throw new Error(
        `Failed to generate quiz: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async generateQuizWithA2A(
    input: string
  ): Promise<QuizGenerationResponse> {
    if (!this.isClientSide) {
      throw new Error("A2A client only available on client side");
    }

    // Dynamic import to avoid SSR issues
    const { A2AClient } = await import("@a2a-js/sdk/client");
    const a2aClient = new A2AClient();

    const request = {
      skillId: "generate-quiz",
      input: {
        parts: [
          {
            kind: "text",
            text: input,
          },
        ],
      },
    };

    // Submit task to backend agent using A2A SDK
    const task = await a2aClient.submitTask(this.backendAgentUrl, request);
    console.log("A2A task submitted:", task.id);

    // Wait for task completion using A2A SDK
    const completedTask = await a2aClient.waitForTaskCompletion(
      this.backendAgentUrl,
      task.id
    );
    console.log("A2A task completed:", completedTask.status.state);

    if (completedTask.status.state === "completed" && completedTask.artifacts) {
      // Extract quiz data from A2A artifacts
      const quizArtifact = completedTask.artifacts.find(
        (artifact: any) => artifact.name === "quiz.json"
      );

      if (quizArtifact && quizArtifact.parts) {
        const quizData = JSON.parse(quizArtifact.parts[0].text);
        return {
          data: quizData,
        };
      }
    }

    throw new Error("Task did not complete successfully or no quiz data found");
  }

  private async generateQuizWithREST(
    input: string
  ): Promise<QuizGenerationResponse> {
    const response = await fetch(
      `${this.backendAgentUrl}/api/actions/generate-quiz`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return {
      data: result.data || result,
    };
  }

  /**
   * Generate quiz with usage tracking
   */
  async generateQuizWithUsage(input: string): Promise<QuizGenerationResponse> {
    return this.generateQuiz(input);
  }

  /**
   * Submit a custom task to the backend agent
   */
  async submitCustomTask(skillId: string, input: any): Promise<any> {
    try {
      if (this.isClientSide) {
        // Try A2A first
        try {
          const { A2AClient } = await import("@a2a-js/sdk/client");
          const a2aClient = new A2AClient();

          const request = {
            skillId,
            input,
          };

          const task = await a2aClient.submitTask(
            this.backendAgentUrl,
            request
          );
          return await a2aClient.waitForTaskCompletion(
            this.backendAgentUrl,
            task.id
          );
        } catch (a2aError) {
          console.log("A2A custom task failed, using REST fallback");
          throw new Error("Custom tasks require A2A protocol");
        }
      } else {
        throw new Error("Custom tasks not available on server side");
      }
    } catch (error) {
      console.error("Failed to submit custom task:", error);
      throw error;
    }
  }

  /**
   * Check health of backend agent
   */
  async checkHealth(): Promise<{
    status: string;
    agent?: string;
    message?: string;
  }> {
    try {
      if (this.isClientSide) {
        // Try A2A first
        try {
          const { A2AClient } = await import("@a2a-js/sdk/client");
          const a2aClient = new A2AClient();

          const agentCard = await a2aClient.getAgentCard(this.backendAgentUrl);

          return {
            status: "ok",
            agent: agentCard.name,
            message: "Backend agent is healthy (A2A)",
          };
        } catch (a2aError) {
          console.log("A2A health check failed, using REST fallback");
          // Fall through to REST
        }
      }

      // REST API fallback
      const response = await fetch(`${this.backendAgentUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        return {
          status: "ok",
          message: "Backend agent is healthy (REST)",
        };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check health of frontend agent
   */
  async checkFrontendHealth(): Promise<{
    status: string;
    agent?: string;
    message?: string;
  }> {
    try {
      if (this.isClientSide) {
        // Try A2A first
        try {
          const { A2AClient } = await import("@a2a-js/sdk/client");
          const a2aClient = new A2AClient();

          const frontendUrl = "http://localhost:3000";
          const agentCard = await a2aClient.getAgentCard(frontendUrl);

          return {
            status: "ok",
            agent: agentCard.name,
            message: "Frontend agent is healthy (A2A)",
          };
        } catch (a2aError) {
          console.log("A2A frontend health check failed, using REST fallback");
          // Fall through to REST
        }
      }

      // REST API fallback
      const response = await fetch("http://localhost:3000/api/health");
      if (response.ok) {
        const data = await response.json();
        return {
          status: "ok",
          message: "Frontend agent is healthy (REST)",
        };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Frontend health check failed:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get backend agent card information
   */
  async getBackendAgentInfo() {
    try {
      if (this.isClientSide) {
        // Try A2A first
        try {
          const { A2AClient } = await import("@a2a-js/sdk/client");
          const a2aClient = new A2AClient();

          return await a2aClient.getAgentCard(this.backendAgentUrl);
        } catch (a2aError) {
          console.log("A2A agent info failed, using REST fallback");
          // Fall through to REST
        }
      }

      // REST API fallback
      const response = await fetch(
        `${this.backendAgentUrl}/.well-known/agent-card.json`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch agent card: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get backend agent card:", error);
      throw error;
    }
  }

  /**
   * List available skills from backend agent
   */
  async getBackendSkills() {
    try {
      const agentCard = await this.getBackendAgentInfo();
      return agentCard?.skills || [];
    } catch (error) {
      console.error("Failed to get backend skills:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const quizA2AClient = new QuizA2AClient();
