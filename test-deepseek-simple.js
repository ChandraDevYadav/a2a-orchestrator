// Simple test to verify DeepSeek integration
const testDeepSeek = async () => {
  try {
    console.log("🧪 Testing DeepSeek Chat Agent...");

    // Import the agent
    const { deepSeekChatAgent } = await import("./src/lib/deepseek-chat-agent");

    // Test 1: Simple greeting
    console.log("\n📝 Test 1: Greeting");
    const greeting = await deepSeekChatAgent.generateResponse("Hello!");
    console.log("Response:", greeting.content);

    // Test 2: Quiz classification
    console.log("\n📝 Test 2: Quiz Classification");
    const isQuiz = await deepSeekChatAgent.isQuizRequest(
      "create a quiz about science"
    );
    console.log("Is Quiz Request:", isQuiz);

    console.log("\n✅ DeepSeek integration test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testDeepSeek();
