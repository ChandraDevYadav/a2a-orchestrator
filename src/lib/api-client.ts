import { QuizGenerationRequest, QuizGenerationResponse } from "@/types/quiz";
import { realQuizA2AClient } from "./a2a-client-real";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

export class QuizApiClient {
  private baseUrl: string;
  private useA2A: boolean;
  private useRealA2A: boolean;

  constructor(
    baseUrl: string = API_BASE_URL,
    useA2A: boolean = true,
    useRealA2A: boolean = true
  ) {
    this.baseUrl = baseUrl;
    this.useA2A = useA2A;
    this.useRealA2A = useRealA2A;
  }

  async generateQuiz(input: string): Promise<QuizGenerationResponse> {
    if (this.useA2A) {
      try {
        // Use A2A protocol to communicate with backend agent
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
    if (this.useA2A) {
      // Use A2A protocol with usage tracking
      return await realQuizA2AClient.generateQuizWithUsage(input);
    } else {
      // Fallback to REST API
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
    if (this.useA2A) {
      // Use A2A protocol to check backend agent health
      return await realQuizA2AClient.checkHealth();
    } else {
      // Fallback to REST API
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed! status: ${response.status}`);
      }

      return response.json();
    }
  }

  /**
   * Get backend agent information via A2A protocol
   */
  async getBackendAgentInfo() {
    if (this.useA2A) {
      return await realQuizA2AClient.getBackendAgentInfo();
    } else {
      throw new Error("Agent info only available via A2A protocol");
    }
  }

  /**
   * Get available skills from backend agent
   */
  async getBackendSkills() {
    if (this.useA2A) {
      return await realQuizA2AClient.getBackendSkills();
    } else {
      throw new Error("Skills info only available via A2A protocol");
    }
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
