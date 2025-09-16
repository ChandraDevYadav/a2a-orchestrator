# DeepSeek Chat Agent Integration

This document describes the integration of DeepSeek API for intelligent chat responses in the quiz application.

## Overview

The DeepSeek Chat Agent provides intelligent responses for general conversation while routing quiz creation requests to the existing quiz creator agent. This creates a seamless experience where users can:

1. **Have natural conversations** - Ask questions, get explanations, chat normally
2. **Create quizzes intelligently** - When users request quiz creation, it's routed to the specialized quiz creator

## Architecture

### Components

1. **DeepSeekChatAgent** (`src/lib/deepseek-chat-agent.ts`)

   - Handles general chat using DeepSeek API
   - Classifies requests as quiz vs. general chat
   - Provides fallback responses if API fails

2. **QuizChat Component** (`src/components/QuizChat.tsx`)
   - Modified to use DeepSeek for general chat
   - Routes quiz requests to existing quiz creator
   - Maintains chat history for context

### Flow

```
User Input → DeepSeek Classification → {
  Quiz Request? → Quiz Creator Agent → Generate Quiz
  General Chat? → DeepSeek Chat Agent → Generate Response
}
```

## Configuration

### API Key

The DeepSeek API key is configured in `src/lib/deepseek-chat-agent.ts`:

```typescript
export const deepSeekChatAgent = new DeepSeekChatAgent(
  "sk-6796ea0f38c7499dbf47c7ff2a026966"
);
```

### Environment Variables (Optional)

You can also use environment variables by modifying the agent initialization:

```typescript
const apiKey =
  process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY ||
  "sk-6796ea0f38c7499dbf47c7ff2a026966";
export const deepSeekChatAgent = new DeepSeekChatAgent(apiKey);
```

## Features

### 1. Intelligent Classification

- Uses DeepSeek AI to determine if input is a quiz request
- Handles various phrasings and contexts
- Fallback to pattern matching if AI classification fails

### 2. Contextual Responses

- Maintains chat history for better context
- Provides educational and helpful responses
- Guides users on quiz creation when appropriate

### 3. Error Handling

- Graceful fallback to simple responses
- Comprehensive error logging
- User-friendly error messages

## Usage Examples

### General Chat

```
User: "Hello, how are you?"
DeepSeek: "Hello! I'm doing well, thank you for asking. I'm here to help you with any questions you might have or assist you in creating quizzes on various topics. What would you like to explore today?"

User: "What is photosynthesis?"
DeepSeek: "Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy..."
```

### Quiz Creation

```
User: "create a quiz about the solar system"
DeepSeek Classification: true
→ Routes to Quiz Creator Agent
→ Generates quiz with multiple choice questions
```

### Educational Support

```
User: "Explain the water cycle"
DeepSeek: "The water cycle, also known as the hydrological cycle, describes the continuous movement of water within the Earth and atmosphere..."
```

## Testing

Run the test script to verify the integration:

```bash
cd quiz-frontend
node test-deepseek-integration.js
```

## Dependencies

- `openai`: For DeepSeek API integration
- `@types/node`: For TypeScript support

## API Limits and Considerations

- DeepSeek API has rate limits and token usage
- Responses are limited to 500 tokens for efficiency
- Chat history is limited to last 10 messages for context
- Classification requests use minimal tokens (10 max)

## Troubleshooting

### Common Issues

1. **API Key Invalid**

   - Verify the API key is correct
   - Check if the key has sufficient credits

2. **Network Errors**

   - Ensure internet connectivity
   - Check if DeepSeek API is accessible

3. **Rate Limiting**
   - Implement exponential backoff
   - Consider caching responses

### Debug Mode

Enable debug logging by adding to the component:

```typescript
console.log("DeepSeek Response:", response);
console.log("Classification Result:", isQuiz);
```

## Future Enhancements

1. **Response Caching**: Cache common responses to reduce API calls
2. **Streaming Responses**: Implement real-time response streaming
3. **Custom Prompts**: Allow users to customize AI behavior
4. **Multi-language Support**: Support for different languages
5. **Analytics**: Track usage patterns and response quality

## Security Considerations

- API key should be stored securely in production
- Consider implementing request rate limiting
- Validate and sanitize all user inputs
- Monitor API usage for unusual patterns
