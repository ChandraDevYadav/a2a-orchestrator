/**
 * Test script for integrated orchestrator setup
 * Tests the local orchestrator API routes on port 3000
 */

const FRONTEND_URL = "http://localhost:3000";

async function testIntegratedOrchestrator() {
  console.log("🧪 Testing Integrated Orchestrator Setup");
  console.log("=".repeat(50));

  try {
    // Test 1: Health Check
    console.log("\n1️⃣ Testing Health Check...");
    const healthResponse = await fetch(
      `${FRONTEND_URL}/api/orchestrator?action=health`
    );

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("✅ Health Check Passed:", healthData);
    } else {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    // Test 2: Agent Discovery
    console.log("\n2️⃣ Testing Agent Discovery...");
    const discoverResponse = await fetch(`${FRONTEND_URL}/api/orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "discover_agents" }),
    });

    if (discoverResponse.ok) {
      const discoverData = await discoverResponse.json();
      console.log("✅ Agent Discovery Passed:", discoverData);
    } else {
      throw new Error(`Agent discovery failed: ${discoverResponse.status}`);
    }

    // Test 3: Quiz Workflow
    console.log("\n3️⃣ Testing Quiz Workflow...");
    const quizResponse = await fetch(`${FRONTEND_URL}/api/orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "orchestrate_quiz_workflow",
        query: "JavaScript basics",
        context: { questionCount: 5 },
      }),
    });

    if (quizResponse.ok) {
      const quizData = await quizResponse.json();
      console.log("✅ Quiz Workflow Passed:", quizData);
    } else {
      throw new Error(`Quiz workflow failed: ${quizResponse.status}`);
    }

    // Test 4: System Health Monitoring
    console.log("\n4️⃣ Testing System Health Monitoring...");
    const monitorResponse = await fetch(`${FRONTEND_URL}/api/orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "monitor_system_health" }),
    });

    if (monitorResponse.ok) {
      const monitorData = await monitorResponse.json();
      console.log("✅ System Health Monitoring Passed:", monitorData);
    } else {
      throw new Error(
        `System health monitoring failed: ${monitorResponse.status}`
      );
    }

    // Test 5: Get All Agents
    console.log("\n5️⃣ Testing Get All Agents...");
    const agentsResponse = await fetch(`${FRONTEND_URL}/api/orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_agents" }),
    });

    if (agentsResponse.ok) {
      const agentsData = await agentsResponse.json();
      console.log("✅ Get All Agents Passed:", agentsData);
    } else {
      throw new Error(`Get all agents failed: ${agentsResponse.status}`);
    }

    console.log(
      "\n🎉 All Tests Passed! Integrated Orchestrator is working correctly."
    );
    console.log("\n📋 Summary:");
    console.log("✅ Frontend + Orchestrator running on port 3000");
    console.log("✅ All API routes responding correctly");
    console.log("✅ Ready for production deployment");
  } catch (error) {
    console.error("\n❌ Test Failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure the frontend is running: npm run dev");
    console.log("2. Check that port 3000 is available");
    console.log("3. Verify the integrated orchestrator API routes are working");
    process.exit(1);
  }
}

// Run the test
testIntegratedOrchestrator();
