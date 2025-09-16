// Test script for DeepSeek Chat Agent integration
import { deepSeekChatAgent } from "./src/lib/deepseek-chat-agent";

async function testDeepSeekIntegration() {
  console.log("🧪 Testing DeepSeek Chat Agent Integration...\n");

  try {
    // Test 1: General chat
    console.log("📝 Test 1: General Chat");
    console.log('Input: "Hello, how are you?"');
    const chatResponse = await deepSeekChatAgent.generateResponse(
      "Hello, how are you?"
    );
    console.log("Response:", chatResponse.content);
    console.log("Usage:", chatResponse.usage);
    console.log("");

    // Test 2: Quiz request classification
    console.log("📝 Test 2: Quiz Request Classification");
    console.log('Input: "create a quiz about science"');
    const isQuiz1 = await deepSeekChatAgent.isQuizRequest(
      "create a quiz about science"
    );
    console.log("Is Quiz Request:", isQuiz1);
    console.log("");

    // Test 3: Non-quiz request classification
    console.log("📝 Test 3: Non-Quiz Request Classification");
    console.log('Input: "what is photosynthesis?"');
    const isQuiz2 = await deepSeekChatAgent.isQuizRequest(
      "what is photosynthesis?"
    );
    console.log("Is Quiz Request:", isQuiz2);
    console.log("");

    // Test 4: Educational question
    console.log("📝 Test 4: Educational Question");
    console.log('Input: "Explain the water cycle"');
    const eduResponse = await deepSeekChatAgent.generateResponse(
      "Explain the water cycle"
    );
    console.log("Response:", eduResponse.content);
    console.log("");

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDeepSeekIntegration();
}

export { testDeepSeekIntegration };
