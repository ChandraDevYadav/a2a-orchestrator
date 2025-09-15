import { QuizGenerationRequest, QuizGenerationResponse } from "@/types/quiz";
import { realQuizA2AClient } from "./a2a-client-real";
import { orchestratorClient } from "./orchestrator-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:5000";

export class QuizApiClient {
  private baseUrl: string;
  private orchestratorUrl: string;
  private useA2A: boolean;
  private useRealA2A: boolean;
  private useOrchestrator: boolean;

  constructor(
    baseUrl: string = API_BASE_URL,
    orchestratorUrl: string = ORCHESTRATOR_URL,
    useA2A: boolean = true,
    useRealA2A: boolean = true,
    useOrchestrator: boolean = true
  ) {
    this.baseUrl = baseUrl;
    this.orchestratorUrl = orchestratorUrl;
    this.useA2A = useA2A;
    this.useRealA2A = useRealA2A;
    this.useOrchestrator = useOrchestrator;
  }

  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    // Try orchestrator first if enabled (now with A2A protocol)
    if (this.useOrchestrator) {
      try {
        console.log("🎯 Using A2A-enabled orchestrator for quiz generation...");
        const result = await orchestratorClient.orchestrateQuizWorkflow({
          query: input,
          context: {
            type: "quiz_generation",
            difficulty: "medium",
            questionCount: 20,
          },
        });

        console.log("✅ A2A orchestrator workflow completed:", result);

        // Extract quiz data from orchestrator result
        if (result && typeof result === "object" && "result" in result) {
          const resultData = result as { result?: { data?: any } };
          if (resultData.result && resultData.result.data) {
            console.log(
              "🎯 Quiz data extracted from A2A orchestrator:",
              resultData.result.data
            );
            return {
              data: resultData.result.data,
            };
          }
        }

        // If no data in result, fall through to direct A2A
        console.log(
          "⚠️ No quiz data in A2A orchestrator result, falling back to direct A2A"
        );
      } catch (orchestratorError) {
        console.error(
          "❌ A2A orchestrator failed, falling back to direct A2A:",
          orchestratorError
        );
      }
    }

    // Fallback to A2A protocol
    if (this.useA2A) {
      try {
        console.log("🔄 Using A2A protocol for quiz generation...");
        return await realQuizA2AClient.generateQuiz(input);
      } catch (a2aError) {
        console.error(
          "A2A quiz generation failed, trying REST API fallback:",
          a2aError
        );

        // Fallback to REST API
        try {
          const response = await fetch(
            `${this.baseUrl}/api/actions/generate-quiz`,
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
          console.log("REST API fallback successful:", result);
          return result;
        } catch (restError) {
          console.error("REST API fallback also failed:", restError);

          // Final fallback - return a mock quiz
          console.log("Using mock quiz as final fallback");
          return this.generateMockQuiz(input);
        }
      }
    } else {
      // Direct REST API call
      const response = await fetch(
        `${this.baseUrl}/api/actions/generate-quiz`,
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

      return response.json();
    }
  }

  async generateQuizWithUsage(input: string): Promise<QuizGenerationResponse> {
    if (this.useOrchestrator) {
      try {
        console.log(
          "🎯 Using A2A orchestrator for quiz generation with usage tracking..."
        );
        const result = await orchestratorClient.executeAgentWithResilience(
          `Generate quiz: ${input}`,
          { type: "quiz_generation_with_usage", input }
        );

        console.log("✅ A2A orchestrator execution completed:", result);

        const resultData = result as { result?: any };
        return {
          data: resultData.result || { quiz_questions: [] },
        };
      } catch (error) {
        console.error("A2A orchestrator usage tracking failed:", error);
      }
    }

    if (this.useA2A) {
      return await realQuizA2AClient.generateQuizWithUsage(input);
    } else {
      const response = await fetch(`${this.baseUrl}/api/actions/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    }
  }

  async checkHealth(): Promise<{ status: string }> {
    if (this.useOrchestrator) {
      try {
        console.log("🎯 Using A2A orchestrator for health check...");
        const health = await orchestratorClient.monitorSystemHealth();
        console.log("✅ A2A orchestrator health check completed:", health);
        const healthData = health as {
          overall_health?: string;
          status?: string;
          [key: string]: any;
        };
        return {
          status: healthData.overall_health || healthData.status || "healthy",
          details: healthData,
        } as { status: string; details?: any };
      } catch (error) {
        console.error("A2A orchestrator health check failed:", error);
      }
    }

    if (this.useA2A) {
      return await realQuizA2AClient.checkHealth();
    } else {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed! status: ${response.status}`);
      }

      return response.json();
    }
  }

  /**
   * Get backend agent information via orchestrator
   */
  async getBackendAgentInfo() {
    if (this.useOrchestrator) {
      try {
        const agents = await orchestratorClient.getAllAgents();
        return {
          agents,
          orchestratorUrl: this.orchestratorUrl,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Failed to get agent info via orchestrator:", error);
        throw error;
      }
    }

    if (this.useA2A) {
      return await realQuizA2AClient.getBackendAgentInfo();
    } else {
      throw new Error(
        "Agent info only available via orchestrator or A2A protocol"
      );
    }
  }

  /**
   * Get available skills from orchestrator
   */
  async getBackendSkills() {
    if (this.useOrchestrator) {
      try {
        const workflows = await orchestratorClient.getAllWorkflows();
        return {
          workflows,
          orchestratorUrl: this.orchestratorUrl,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Failed to get skills via orchestrator:", error);
        throw error;
      }
    }

    if (this.useA2A) {
      return await realQuizA2AClient.getBackendSkills();
    } else {
      throw new Error(
        "Skills info only available via orchestrator or A2A protocol"
      );
    }
  }

  /**
   * Discover agents via A2A orchestrator
   */
  async discoverAgents() {
    if (this.useOrchestrator) {
      try {
        console.log("🎯 Using A2A orchestrator for agent discovery...");
        const result = await orchestratorClient.discoverAgents();
        console.log("✅ A2A orchestrator agent discovery completed:", result);
        return result;
      } catch (error) {
        console.error("Agent discovery via A2A orchestrator failed:", error);
        throw error;
      }
    }

    throw new Error("Agent discovery only available via A2A orchestrator");
  }

  /**
   * Switch between orchestrator and direct modes
   */
  setUseOrchestrator(useOrchestrator: boolean) {
    this.useOrchestrator = useOrchestrator;
  }

  /**
   * Switch between A2A and REST modes
   */
  setUseA2A(useA2A: boolean) {
    this.useA2A = useA2A;
  }

  /**
   * Switch between real A2A and simulated A2A modes
   */
  setUseRealA2A(useRealA2A: boolean) {
    this.useRealA2A = useRealA2A;
  }

  /**
   * Generate a mock quiz as final fallback
   */
  private generateMockQuiz(input: string): QuizGenerationResponse {
    return {
      data: {
        quiz_questions: [
          {
            question: `What is the main topic of: ${input}?`,
            correct_answer: "A",
            answers: [
              { answer: "The topic mentioned in the question" },
              { answer: "Something completely different" },
              { answer: "A random topic" },
              { answer: "None of the above" },
            ],
            difficulty: "medium",
          },
          {
            question: `Which of the following is most relevant to: ${input}?`,
            correct_answer: "B",
            answers: [
              { answer: "Option A" },
              { answer: "The most relevant option" },
              { answer: "Option C" },
              { answer: "Option D" },
            ],
            difficulty: "medium",
          },
          {
            question: `True or False: ${input} is an important topic.`,
            correct_answer: "A",
            answers: [{ answer: "True" }, { answer: "False" }],
            difficulty: "easy",
          },
        ],
      },
    };
  }
}

export const quizApiClient = new QuizApiClient();
