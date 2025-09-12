"use client";

import {
  QuizData,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "@/types/quiz";

/**
 * Browser-Compatible A2A Client for communicating with backend quiz agent
 * Uses fetch API to implement A2A protocol communication in the browser
 */
export class RealQuizA2AClient {
  private backendAgentUrl: string;

  constructor(backendAgentUrl: string = "http://localhost:4001") {
    this.backendAgentUrl = backendAgentUrl;
  }

  /**
   * Generate quiz using browser-compatible A2A protocol communication
   */
  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    try {
      console.log("Starting A2A quiz generation...");

      // Create A2A request
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

      // Submit task to backend agent via REST API (A2A fallback)
      const task = await this.submitTask(request);
      console.log("Task completed:", task.status);

      if (task.status === "completed" && task.data) {
        return {
          data: task.data,
        };
      } else {
        throw new Error("Task did not complete successfully");
      }
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
   * Submit a task to the backend agent using A2A protocol
   */
  async submitTask(request: any): Promise<any> {
    try {
      // Extract the actual text input from the A2A request format
      const textInput =
        request.input?.parts?.find((part: any) => part.kind === "text")?.text ||
        "";

      const response = await fetch(
        `${this.backendAgentUrl}/api/actions/generate-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: textInput,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Since we're using REST fallback, return the quiz data directly
      // This simulates a completed task
      return {
        id: `task_${Date.now()}`,
        status: "completed",
        data: result.data,
      };
    } catch (error) {
      console.error("Failed to submit task:", error);
      throw error;
    }
  }

  /**
   * Wait for task completion using polling
   */
  async waitForTaskCompletion(taskId: string): Promise<any> {
    try {
      // For now, simulate task completion since we're using REST fallback
      // In a real A2A implementation, this would poll the task status
      const maxAttempts = 30; // 30 seconds max
      let attempts = 0;

      while (attempts < maxAttempts) {
        // Simulate waiting for task completion
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        // For demo purposes, return a mock completed task
        if (attempts >= 2) {
          return {
            id: taskId,
            status: {
              state: "completed",
              timestamp: new Date().toISOString(),
            },
            artifacts: [
              {
                artifactId: "quiz-1",
                name: "quiz.json",
                parts: [
                  {
                    kind: "text",
                    text: JSON.stringify({
                      quiz_questions: [
                        {
                          question: "What is machine learning?",
                          correct_answer: "A. A subset of AI",
                          answers: [
                            { answer: "A. A subset of AI" },
                            { answer: "B. A programming language" },
                            { answer: "C. A database system" },
                            { answer: "D. A web framework" },
                            { answer: "E. A cloud service" },
                          ],
                        },
                      ],
                    }),
                  },
                ],
              },
            ],
          };
        }
      }

      throw new Error("Task timeout");
    } catch (error) {
      console.error("Failed to wait for task completion:", error);
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
      // Try to get agent card to check if agent is alive
      const agentCard = await this.getAgentCard(this.backendAgentUrl);

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
      // Try to get frontend agent card
      const frontendUrl = "http://localhost:3000";
      const agentCard = await this.getAgentCard(frontendUrl);

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
   * Get agent card information using fetch API
   */
  async getAgentCard(agentUrl: string): Promise<any> {
    try {
      const response = await fetch(`${agentUrl}/.well-known/agent-card.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch agent card: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get agent card:", error);
      throw error;
    }
  }

  /**
   * Get backend agent card information
   */
  async getBackendAgentInfo() {
    try {
      const agentCard = await this.getAgentCard(this.backendAgentUrl);
      return agentCard;
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

  /**
   * Submit a custom task to the backend agent
   */
  async submitCustomTask(skillId: string, input: any) {
    try {
      const request = {
        skillId,
        input,
      };

      const task = await this.submitTask(request);
      return task;
    } catch (error) {
      console.error("Failed to submit custom task:", error);
      throw error;
    }
  }

  /**
   * Wait for a specific task to complete
   */
  async waitForTask(taskId: string) {
    try {
      return await this.waitForTaskCompletion(taskId);
    } catch (error) {
      console.error("Failed to wait for task:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const realQuizA2AClient = new RealQuizA2AClient();
