import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize DeepSeek client on server side
const deepSeekClient = new OpenAI({
  apiKey: "sk-6796ea0f38c7499dbf47c7ff2a026966",
  baseURL: "https://api.deepseek.com",
});

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

async function generateResponse(
  userMessage: string,
  chatHistory: DeepSeekChatMessage[] = []
): Promise<DeepSeekChatResponse> {
  try {
    // Create system message for the AI assistant
    const systemMessage: DeepSeekChatMessage = {
      role: "system",
      content: `You are a helpful AI assistant integrated into a quiz application. You can:

1. **Answer general questions** - Provide helpful, accurate, and friendly responses
2. **Help with quiz creation** - When users ask to create quizzes, guide them on how to do so
3. **Provide educational support** - Help with learning and understanding various topics

Guidelines:
- Be conversational and friendly
- Keep responses concise but informative
- If someone asks to create a quiz, explain that they should use phrases like "create a quiz about [topic]" or "generate a quiz on [subject]"
- Always be helpful and encouraging
- If you don't know something, say so honestly

Current context: You're helping a user who is using a quiz application.`,
    };

    // Prepare messages array
    const messages: DeepSeekChatMessage[] = [
      systemMessage,
      ...chatHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    const completion = await deepSeekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: 500,
      temperature: 0.7,
      stream: false,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I apologize, but I couldn't generate a response.";

    return {
      content: response,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw new Error(
      `Failed to generate response: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function isQuizRequest(userMessage: string): Promise<boolean> {
  try {
    const systemMessage = {
      role: "system" as const,
      content: `You are a classifier that determines if a user message is requesting quiz creation.

Return ONLY "true" or "false" based on whether the user wants to create a quiz.

Examples of quiz requests:
- "create a quiz about science"
- "generate a quiz on history"
- "make a quiz for math"
- "quiz about programming"
- "create questions about biology"

Examples of NOT quiz requests:
- "hello"
- "what is photosynthesis?"
- "help me understand calculus"
- "tell me about the weather"
- "how are you?"`,
    };

    const completion = await deepSeekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        systemMessage,
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 10,
      temperature: 0.1,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content
      ?.toLowerCase()
      .trim();
    return response === "true";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userMessage, chatHistory = [] } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userMessage" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "generate_response":
        result = await generateResponse(userMessage, chatHistory);
        break;

      case "is_quiz_request":
        result = { isQuiz: await isQuizRequest(userMessage) };
        break;

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Use 'generate_response' or 'is_quiz_request'",
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("DeepSeek API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
