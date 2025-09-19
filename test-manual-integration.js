#!/usr/bin/env node

console.log("🧪 Testing Manual Creator Integration");
console.log("====================================\n");

async function testManualCreation() {
  try {
    console.log("1. Testing manual-creator-agentic service...");
    const manualResponse = await fetch(
      "http://localhost:4002/api/actions/generate-manual",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "test manual" }),
      }
    );

    if (manualResponse.ok) {
      console.log("✅ Manual-creator-agentic: OK");
    } else {
      console.log("❌ Manual-creator-agentic: FAILED");
    }

    console.log("\n2. Testing orchestrator server...");
    const orchestratorResponse = await fetch("http://localhost:5000/health");

    if (orchestratorResponse.ok) {
      console.log("✅ Orchestrator server: OK");
    } else {
      console.log("❌ Orchestrator server: FAILED");
    }

    console.log("\n3. Testing manual workflow orchestration...");
    const workflowResponse = await fetch(
      "http://localhost:5000/api/orchestrate-manual-workflow",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "test topic", prompt: "test prompt" }),
      }
    );

    if (workflowResponse.ok) {
      console.log("✅ Manual workflow orchestration: OK");
    } else {
      console.log("❌ Manual workflow orchestration: FAILED");
      const error = await workflowResponse.text();
      console.log("Error:", error);
    }

    console.log("\n4. Testing frontend API...");
    const frontendResponse = await fetch(
      "http://localhost:3000/api/orchestrator",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "orchestrate-manual-workflow",
          topic: "test topic",
          prompt: "test prompt",
        }),
      }
    );

    if (frontendResponse.ok) {
      console.log("✅ Frontend API: OK");
    } else {
      console.log("❌ Frontend API: FAILED");
      const error = await frontendResponse.text();
      console.log("Error:", error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testManualCreation();
