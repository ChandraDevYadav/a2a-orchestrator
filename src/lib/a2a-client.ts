"use client";

import {
  QuizData,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "@/types/quiz";

// Simplified A2A Client for communicating with backend quiz agent
// This version works in the browser environment
export class QuizA2AClient {
  private backendAgentUrl: string;

  constructor(backendAgentUrl: string = "http://localhost:4001") {
    this.backendAgentUrl = backendAgentUrl;
  }

  /**
   * Generate quiz using A2A protocol by orchestrating with backend agent
   */
  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    try {
      // For now, use REST API with A2A-style request format
      // This simulates A2A protocol communication
      const a2aRequest = {
        skillId: "generate_quiz",
        input: {
          parts: [
            {
              kind: "text",
              text: input,
            },
          ],
        },
      };

      // Send A2A-style request to backend
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

      // Return in A2A format
      return {
        data: result.data || result,
      };
    } catch (error) {
      console.error("A2A quiz generation failed:", error);
      throw new Error(
        `Failed to generate quiz via A2A: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate quiz with usage tracking using A2A protocol
   */
  async generateQuizWithUsage(input: string): Promise<QuizGenerationResponse> {
    // For now, use the same method as generateQuiz
    // In a full implementation, you might want to use a different skill or add usage tracking
    return this.generateQuiz(input);
  }

  /**
   * Check health of backend agent using A2A protocol
   */
  async checkHealth(): Promise<{
    status: string;
    agent?: string;
    message?: string;
  }> {
    try {
      // Try to get agent card to check if agent is alive
      const response = await fetch(
        `${this.backendAgentUrl}/.well-known/agent-card.json`
      );

      if (response.ok) {
        const agentCard = await response.json();
        return { status: "ok", agent: agentCard.name };
      } else {
        return { status: "error", message: "Agent card not accessible" };
      }
    } catch (error) {
      console.error("A2A health check failed:", error);
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
