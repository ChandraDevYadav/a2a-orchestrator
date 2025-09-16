export interface DeepSeekChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DeepSeekChatResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekChatAgent {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/deepseek") {
    this.baseUrl = baseUrl;
  }

  async generateResponse(
    userMessage: string,
    chatHistory: DeepSeekChatMessage[] = []
  ): Promise<DeepSeekChatResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_response",
          userMessage,
          chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("DeepSeek API error:", error);
      throw new Error(
        `Failed to generate response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async isQuizRequest(userMessage: string): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "is_quiz_request",
          userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.isQuiz;
    } catch (error) {
      console.error("DeepSeek classification error:", error);
      // Fallback to simple pattern matching
      const lowerInput = userMessage.toLowerCase();
      return (
        (lowerInput.includes("create") && lowerInput.includes("quiz")) ||
        (lowerInput.includes("generate") && lowerInput.includes("quiz")) ||
        (lowerInput.includes("make") && lowerInput.includes("quiz")) ||
        lowerInput.includes("quiz about") ||
        lowerInput.includes("quiz on")
      );
    }
  }
}

// Create singleton instance
export const deepSeekChatAgent = new DeepSeekChatAgent();
