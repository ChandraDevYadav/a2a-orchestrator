// Test script for DeepSeek API route
const testDeepSeekAPI = async () => {
  try {
    console.log("🧪 Testing DeepSeek API Route...");

    // Test 1: Generate response
    console.log("\n📝 Test 1: Generate Response");
    const response1 = await fetch("http://localhost:3001/api/deepseek", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "generate_response",
        userMessage: "Hello!",
        chatHistory: [],
      }),
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log("Response:", result1.content);
    } else {
      console.error("Error:", response1.status, await response1.text());
    }

    // Test 2: Quiz classification
    console.log("\n📝 Test 2: Quiz Classification");
    const response2 = await fetch("http://localhost:3001/api/deepseek", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "is_quiz_request",
        userMessage: "create a quiz about science",
      }),
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log("Is Quiz Request:", result2.isQuiz);
    } else {
      console.error("Error:", response2.status, await response2.text());
    }

    console.log("\n✅ API route tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Wait a moment for server to start, then run test
setTimeout(testDeepSeekAPI, 5000);
