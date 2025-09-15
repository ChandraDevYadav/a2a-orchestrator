/**
 * Test script for A2A-Orchestrator Integration
 * This script tests the complete A2A-JS protocol integration with the orchestrator
 */

const { A2AClient } = require("@a2a-js/sdk/client");

// Test configuration
const ORCHESTRATOR_URL = "http://localhost:5000";
const BACKEND_URL = "http://localhost:4001";
const FRONTEND_URL = "http://localhost:3000";

class A2AOrchestratorTester {
  constructor() {
    this.results = {
      orchestratorHealth: null,
      agentDiscovery: null,
      quizWorkflow: null,
      directA2A: null,
      errors: [],
    };
  }

  async runAllTests() {
    console.log("🚀 Starting A2A-Orchestrator Integration Tests...\n");

    try {
      // Test 1: Orchestrator Health Check
      await this.testOrchestratorHealth();

      // Test 2: Agent Discovery via Orchestrator
      await this.testAgentDiscovery();

      // Test 3: Quiz Workflow via Orchestrator
      await this.testQuizWorkflow();

      // Test 4: Direct A2A Communication
      await this.testDirectA2A();

      // Test 5: End-to-End Integration
      await this.testEndToEndIntegration();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      this.results.errors.push(error.message);
    }

    this.printResults();
  }

  async testOrchestratorHealth() {
    console.log("🔍 Test 1: Orchestrator Health Check");
    try {
      const response = await fetch(`${ORCHESTRATOR_URL}/health`);
      const health = await response.json();

      if (response.ok) {
        console.log("✅ Orchestrator health check passed:", health);
        this.results.orchestratorHealth = { success: true, data: health };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Orchestrator health check failed:", error);
      this.results.orchestratorHealth = {
        success: false,
        error: error.message,
      };
    }
    console.log("");
  }

  async testAgentDiscovery() {
    console.log("🔍 Test 2: Agent Discovery via Orchestrator");
    try {
      const response = await fetch(`${ORCHESTRATOR_URL}/api/discover-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const discovery = await response.json();

      if (response.ok) {
        console.log("✅ Agent discovery passed:", discovery);
        console.log(`   Found ${discovery.count} agents`);
        discovery.agents.forEach((agent) => {
          console.log(`   - ${agent.id}: ${agent.status} at ${agent.url}`);
        });
        this.results.agentDiscovery = { success: true, data: discovery };
      } else {
        throw new Error(`Agent discovery failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Agent discovery failed:", error);
      this.results.agentDiscovery = { success: false, error: error.message };
    }
    console.log("");
  }

  async testQuizWorkflow() {
    console.log("🔍 Test 3: Quiz Workflow via Orchestrator");
    try {
      const workflowData = {
        query: "Create a quiz about JavaScript programming",
        context: {
          type: "quiz_generation",
          difficulty: "medium",
          questionCount: 5,
        },
      };

      const response = await fetch(
        `${ORCHESTRATOR_URL}/api/orchestrate-quiz-workflow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData),
        }
      );

      const workflow = await response.json();

      if (response.ok) {
        console.log("✅ Quiz workflow passed:", workflow);
        if (
          workflow.result &&
          workflow.result.data &&
          workflow.result.data.quiz_questions
        ) {
          console.log(
            `   Generated ${workflow.result.data.quiz_questions.length} questions`
          );
          console.log(`   Workflow ID: ${workflow.workflowId}`);
        }
        this.results.quizWorkflow = { success: true, data: workflow };
      } else {
        throw new Error(`Quiz workflow failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Quiz workflow failed:", error);
      this.results.quizWorkflow = { success: false, error: error.message };
    }
    console.log("");
  }

  async testDirectA2A() {
    console.log("🔍 Test 4: Direct A2A Communication");
    try {
      // Test direct A2A communication with backend
      const a2aClient = await A2AClient.fromCardUrl(BACKEND_URL);

      const message = {
        kind: "message",
        messageId: `test-${Date.now()}`,
        role: "user",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              skillId: "generate-quiz",
              input: {
                topic: "Direct A2A Test",
                difficulty: "easy",
                questionCount: 3,
              },
            }),
          },
        ],
      };

      const response = await a2aClient.sendMessage({
        message,
        configuration: { blocking: true },
      });

      console.log("✅ Direct A2A communication successful:", response);
      this.results.directA2A = { success: true, data: response };
    } catch (error) {
      console.error("❌ Direct A2A communication failed:", error);
      this.results.directA2A = { success: false, error: error.message };
    }
    console.log("");
  }

  async testEndToEndIntegration() {
    console.log("🔍 Test 5: End-to-End Integration");
    try {
      // Test the complete flow: Frontend -> Orchestrator -> Backend (A2A) -> Response
      const testQuery = "Create a quiz about machine learning";

      // Simulate frontend request to orchestrator
      const response = await fetch(`${ORCHESTRATOR_URL}/api/execute-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: testQuery,
          context: { type: "quiz_generation", test: true },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ End-to-end integration successful:", result);
        this.results.endToEnd = { success: true, data: result };
      } else {
        throw new Error(`End-to-end integration failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ End-to-end integration failed:", error);
      this.results.endToEnd = { success: false, error: error.message };
    }
    console.log("");
  }

  printResults() {
    console.log("📊 A2A-Orchestrator Integration Test Results");
    console.log("=".repeat(50));

    const tests = [
      { name: "Orchestrator Health", result: this.results.orchestratorHealth },
      { name: "Agent Discovery", result: this.results.agentDiscovery },
      { name: "Quiz Workflow", result: this.results.quizWorkflow },
      { name: "Direct A2A", result: this.results.directA2A },
      { name: "End-to-End", result: this.results.endToEnd },
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    tests.forEach((test) => {
      if (test.result && test.result.success) {
        console.log(`✅ ${test.name}: PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        if (test.result && test.result.error) {
          console.log(`   Error: ${test.result.error}`);
        }
      }
    });

    console.log("=".repeat(50));
    console.log(`📈 Test Summary: ${passedTests}/${totalTests} tests passed`);

    if (this.results.errors.length > 0) {
      console.log("\n🚨 Errors encountered:");
      this.results.errors.forEach((error) => {
        console.log(`   - ${error}`);
      });
    }

    if (passedTests === totalTests) {
      console.log(
        "\n🎉 All tests passed! A2A-Orchestrator integration is working correctly."
      );
    } else {
      console.log(
        `\n⚠️  ${
          totalTests - passedTests
        } test(s) failed. Please check the errors above.`
      );
    }
  }
}

// Run the tests
async function main() {
  const tester = new A2AOrchestratorTester();
  await tester.runAllTests();
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Test terminated");
  process.exit(0);
});

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = A2AOrchestratorTester;
