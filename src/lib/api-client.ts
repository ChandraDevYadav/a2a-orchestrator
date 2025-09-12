import { QuizGenerationRequest, QuizGenerationResponse } from "@/types/quiz";
import { quizA2AClient } from "./a2a-client";
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
      if (this.useRealA2A) {
        // Use real A2A protocol to communicate with backend agent
        return await realQuizA2AClient.generateQuiz(input);
      } else {
        // Use simulated A2A protocol (fallback)
        return await quizA2AClient.generateQuiz(input);
      }
    } else {
      // Fallback to REST API
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
      if (this.useRealA2A) {
        // Use real A2A protocol with usage tracking
        return await realQuizA2AClient.generateQuizWithUsage(input);
      } else {
        // Use simulated A2A protocol with usage tracking
        return await quizA2AClient.generateQuizWithUsage(input);
      }
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
      if (this.useRealA2A) {
        // Use real A2A protocol to check backend agent health
        return await realQuizA2AClient.checkHealth();
      } else {
        // Use simulated A2A protocol to check backend agent health
        return await quizA2AClient.checkHealth();
      }
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
      if (this.useRealA2A) {
        return await realQuizA2AClient.getBackendAgentInfo();
      } else {
        return await quizA2AClient.getBackendAgentInfo();
      }
    } else {
      throw new Error("Agent info only available via A2A protocol");
    }
  }

  /**
   * Get available skills from backend agent
   */
  async getBackendSkills() {
    if (this.useA2A) {
      if (this.useRealA2A) {
        return await realQuizA2AClient.getBackendSkills();
      } else {
        return await quizA2AClient.getBackendSkills();
      }
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
}

export const quizApiClient = new QuizApiClient();
