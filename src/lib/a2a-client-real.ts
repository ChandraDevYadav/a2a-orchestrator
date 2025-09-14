"use client";

import {
  QuizData,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "@/types/quiz";
import { A2AClient, TaskSubmissionRequest } from "@a2a-js/sdk/client";

/**
 * Real A2A Client using the official @a2a-js/sdk/client
 * Provides proper A2A protocol communication with backend quiz agent
 */
export class RealQuizA2AClient {
  private a2aClient: A2AClient;
  private backendAgentUrl: string;

  constructor(backendAgentUrl: string = "http://localhost:4001") {
    this.backendAgentUrl = backendAgentUrl;
    this.a2aClient = new A2AClient();
  }

  /**
   * Generate quiz using real A2A protocol communication
   */
  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    try {
      console.log("Starting real A2A quiz generation...");

      // Create A2A task submission request
      const request: TaskSubmissionRequest = {
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
      const task = await this.a2aClient.submitTask(
        this.backendAgentUrl,
        request
      );
      console.log("A2A task submitted:", task.id);

      // Wait for task completion using A2A SDK
      const completedTask = await this.a2aClient.waitForTaskCompletion(
        this.backendAgentUrl,
        task.id
      );
      console.log("A2A task completed:", completedTask.status.state);

      if (
        completedTask.status.state === "completed" &&
        completedTask.artifacts
      ) {
        // Extract quiz data from A2A artifacts
        const quizArtifact = completedTask.artifacts.find(
          (artifact) => artifact.name === "quiz.json"
        );

        if (quizArtifact && quizArtifact.parts) {
          const quizData = JSON.parse(quizArtifact.parts[0].text);
          return {
            data: quizData,
          };
        }
      }

      throw new Error(
        "Task did not complete successfully or no quiz data found"
      );
    } catch (error) {
      console.error("Real A2A quiz generation failed:", error);
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
    // Use the same method as generateQuiz since A2A SDK handles task tracking
    return this.generateQuiz(input);
  }

  /**
   * Submit a custom task to the backend agent using A2A SDK
   */
  async submitCustomTask(skillId: string, input: any): Promise<any> {
    try {
      const request: TaskSubmissionRequest = {
        skillId,
        input,
      };

      const task = await this.a2aClient.submitTask(
        this.backendAgentUrl,
        request
      );
      return await this.a2aClient.waitForTaskCompletion(
        this.backendAgentUrl,
        task.id
      );
    } catch (error) {
      console.error("Failed to submit custom task:", error);
      throw error;
    }
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
      // Use A2A SDK to get agent card
      const agentCard = await this.a2aClient.getAgentCard(this.backendAgentUrl);

      return {
        status: "ok",
        agent: agentCard.name,
        message: "Backend agent is healthy",
      };
    } catch (error) {
      console.error("A2A health check failed:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check health of frontend agent using A2A protocol
   */
  async checkFrontendHealth(): Promise<{
    status: string;
    agent?: string;
    message?: string;
  }> {
    try {
      const frontendUrl = "http://localhost:3000";
      const agentCard = await this.a2aClient.getAgentCard(frontendUrl);

      return {
        status: "ok",
        agent: agentCard.name,
        message: "Frontend agent is healthy",
      };
    } catch (error) {
      console.error("Frontend A2A health check failed:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get backend agent card information using A2A SDK
   */
  async getBackendAgentInfo() {
    try {
      return await this.a2aClient.getAgentCard(this.backendAgentUrl);
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
export const realQuizA2AClient = new RealQuizA2AClient();
