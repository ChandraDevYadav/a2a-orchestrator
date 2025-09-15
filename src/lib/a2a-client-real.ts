"use client";

import {
  QuizData,
  QuizGenerationRequest,
  QuizGenerationResponse,
} from "@/types/quiz";
import { A2AClient } from "@a2a-js/sdk/client";
import {
  MessageSendParams,
  SendMessageResponse,
  TaskQueryParams,
} from "@a2a-js/sdk";

/**
 * Real A2A Client using the official @a2a-js/sdk/client
 * Provides proper A2A protocol communication with backend quiz agent
 */
export class RealQuizA2AClient {
  private a2aClient: A2AClient | null = null;
  private backendAgentUrl: string;

  constructor(backendAgentUrl: string = "http://localhost:4001") {
    this.backendAgentUrl = backendAgentUrl;
  }

  /**
   * Initialize A2A client lazily to avoid SSR issues
   */
  private async getA2AClient(): Promise<A2AClient> {
    if (!this.a2aClient) {
      // Use the recommended fromCardUrl method
      this.a2aClient = await A2AClient.fromCardUrl(
        `${this.backendAgentUrl}/.well-known/agent-card.json`
      );
    }
    return this.a2aClient;
  }

  /**
   * Helper method to create a proper A2A message
   */
  private createMessage(text: string): MessageSendParams {
    return {
      message: {
        kind: "message",
        messageId: `msg-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        role: "user",
        parts: [
          {
            kind: "text",
            text: text,
          },
        ],
      },
      configuration: {
        blocking: true,
      },
    };
  }

  /**
   * Generate quiz using real A2A protocol communication
   */
  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    try {
      console.log("Starting real A2A quiz generation...");

      // Get A2A client
      const a2aClient = await this.getA2AClient();

      // Create A2A message request
      const messageParams = this.createMessage(
        `Generate a quiz based on: ${input}`
      );

      // Send message to backend agent using A2A SDK
      const response: SendMessageResponse = await a2aClient.sendMessage(
        messageParams
      );
      console.log("A2A message sent, response:", response);

      // Handle the response based on its type
      if (
        "task" in response &&
        response.task &&
        typeof response.task === "object"
      ) {
        // If it's a task, wait for completion
        const task = response.task as any;
        console.log("A2A task created:", task.id);

        // Poll for task completion with timeout
        let completedTask = task;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        while (
          completedTask.status &&
          (completedTask.status.state === "running" ||
            completedTask.status.state === "submitted") &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          attempts++;

          try {
            const taskResponse = await a2aClient.getTask({ id: task.id });
            console.log(`A2A task polling attempt ${attempts}:`, taskResponse);

            if ("task" in taskResponse && taskResponse.task) {
              completedTask = taskResponse.task as any;
              console.log(`A2A task status: ${completedTask.status?.state}`);
            }
          } catch (pollError) {
            console.error(
              `A2A task polling error (attempt ${attempts}):`,
              pollError
            );
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error(
            "A2A task polling timeout - task did not complete within 30 seconds"
          );
        }

        console.log("A2A task completed:", completedTask.status?.state);

        console.log("A2A task final status:", completedTask.status?.state);
        console.log("A2A task artifacts:", completedTask.artifacts);

        if (
          completedTask.status?.state === "completed" &&
          completedTask.artifacts
        ) {
          // Extract quiz data from A2A artifacts
          const quizArtifact = completedTask.artifacts.find(
            (artifact: any) => artifact.name === "quiz.json"
          );

          console.log("A2A quiz artifact found:", quizArtifact);

          if (quizArtifact && quizArtifact.parts) {
            try {
              const quizData = JSON.parse(quizArtifact.parts[0].text);
              console.log("A2A quiz data parsed successfully:", quizData);
              return {
                data: quizData,
              };
            } catch (parseError) {
              console.error("A2A quiz data parsing failed:", parseError);
              console.log("Raw artifact text:", quizArtifact.parts[0].text);
              throw new Error("Failed to parse quiz data from A2A artifact");
            }
          } else {
            console.error(
              "A2A quiz artifact missing or invalid:",
              quizArtifact
            );
            throw new Error("Quiz artifact is missing or has no parts");
          }
        } else if (completedTask.status?.state === "failed") {
          console.error("A2A task failed:", completedTask);
          throw new Error("A2A task execution failed");
        } else {
          console.error(
            "A2A task not completed or no artifacts:",
            completedTask
          );
          throw new Error(
            `A2A task status: ${completedTask.status?.state}, artifacts: ${
              completedTask.artifacts ? "present" : "missing"
            }`
          );
        }
      } else if (
        "message" in response &&
        response.message &&
        typeof response.message === "object"
      ) {
        // If it's a direct message response, try to extract quiz data
        const message = response.message as any;
        if (message.parts && message.parts.length > 0) {
          try {
            const quizData = JSON.parse(message.parts[0].text);
            return {
              data: quizData,
            };
          } catch (e) {
            // If not JSON, treat as text response
            return {
              data: {
                quiz_questions: [
                  {
                    question: message.parts[0].text,
                    answers: [],
                    correct_answer: "",
                  },
                ],
              },
            };
          }
        }
      }

      throw new Error("No valid quiz data received from A2A agent");
    } catch (error) {
      console.error("A2A quiz generation failed:", error);
      console.log("Falling back to REST API...");

      // Fallback to REST API
      try {
        return await this.fallbackGenerateQuiz(input);
      } catch (fallbackError) {
        console.error("REST API fallback also failed:", fallbackError);
        throw new Error(
          `Both A2A and REST API failed. A2A error: ${
            error instanceof Error ? error.message : "Unknown error"
          }. REST error: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error"
          }`
        );
      }
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
      // Get A2A client
      const a2aClient = await this.getA2AClient();

      const messageParams = this.createMessage(
        JSON.stringify({ skillId, input })
      );

      const response: SendMessageResponse = await a2aClient.sendMessage(
        messageParams
      );

      // Handle response - simplified for custom tasks
      if ("task" in response && response.task) {
        return response.task;
      } else if ("message" in response && response.message) {
        return response.message;
      }

      throw new Error("No valid response received from A2A agent");
    } catch (error) {
      console.error("A2A custom task submission failed:", error);
      throw error;
    }
  }

  /**
   * Fallback method to generate quiz using REST API
   */
  private async fallbackGenerateQuiz(
    input: string
  ): Promise<QuizGenerationResponse> {
    try {
      console.log("Using REST API fallback for quiz generation...");

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
      console.log("REST API quiz generation successful:", result);
      return result;
    } catch (error) {
      console.error("REST API fallback failed:", error);
      throw error;
    }
  }

  /**
   * Check health of backend agent using A2A protocol
   */
  async checkHealth(): Promise<any> {
    try {
      // Get A2A client
      const a2aClient = await this.getA2AClient();

      const messageParams = this.createMessage("health check");

      const response: SendMessageResponse = await a2aClient.sendMessage(
        messageParams
      );

      return {
        status: "healthy",
        response: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("A2A health check failed:", error);
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get backend agent information using A2A protocol
   */
  async getBackendAgentInfo(): Promise<any> {
    try {
      // Get A2A client
      const a2aClient = await this.getA2AClient();

      const messageParams = this.createMessage("get agent info");

      const response: SendMessageResponse = await a2aClient.sendMessage(
        messageParams
      );

      return {
        agentUrl: this.backendAgentUrl,
        response: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("A2A agent info request failed:", error);
      throw error;
    }
  }

  /**
   * Get backend agent skills using A2A protocol
   */
  async getBackendSkills(): Promise<any> {
    try {
      // Get A2A client
      const a2aClient = await this.getA2AClient();

      const messageParams = this.createMessage("get skills");

      const response: SendMessageResponse = await a2aClient.sendMessage(
        messageParams
      );

      return {
        skills: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to get backend skills:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const realQuizA2AClient = new RealQuizA2AClient();
