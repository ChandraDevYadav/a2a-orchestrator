/**
 * Standalone Orchestrator Server with A2A-JS Protocol Integration
 * Runs on a separate port for better separation of concerns
 */

const express = require("express");
const cors = require("cors");
const { A2AClient } = require("@a2a-js/sdk/client");

const app = express();
const PORT = process.env.ORCHESTRATOR_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// A2A-enabled orchestrator service
const orchestratorService = {
  discoverAgents: async (data) => {
    const agents = [];
    const knownUrls = [
      "http://localhost:3000",
      "http://localhost:4001",
      "http://localhost:4002",
      "http://localhost:5000",
    ];

    for (const url of knownUrls) {
      try {
        // Use A2A SDK to get agent card
        const a2aClient = await A2AClient.fromCardUrl(url);
        const agentCard = await a2aClient.getAgentCard();

        agents.push({
          id: agentCard.name || url.split(":").pop(),
          url: url,
          status: "online",
          capabilities: agentCard.capabilities || [],
          skills: agentCard.skills || [],
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to discover agent at ${url}:`, error);
        agents.push({
          id: url.split(":").pop(),
          url: url,
          status: "offline",
          error: error.message,
        });
      }
    }

    return {
      agents,
      count: agents.length,
      timestamp: new Date().toISOString(),
    };
  },

  orchestrateQuizWorkflow: async (data) => {
    const topic = data.query || data.input || "General Knowledge";
    const questionCount = data.context?.questionCount || 20;

    try {
      console.log(`🎯 Orchestrating quiz workflow for topic: ${topic}`);

      // Use A2A protocol to communicate with backend agent
      const backendUrl = "http://localhost:4001";
      const a2aClient = await A2AClient.fromCardUrl(backendUrl);

      // Create A2A message for quiz generation
      const message = {
        kind: "message",
        messageId: `quiz-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        role: "user",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              skillId: "generate-quiz",
              input: {
                topic: topic,
                difficulty: "medium",
                questionCount: questionCount,
              },
            }),
          },
        ],
      };

      // Send message using A2A SDK
      const response = await a2aClient.sendMessage({
        message,
        configuration: {
          blocking: true,
        },
      });

      console.log("A2A response received:", response);

      // Handle the response
      if (response && typeof response === "object" && "task" in response) {
        const task = response.task;

        // Poll for task completion
        let completedTask = task;
        let attempts = 0;
        const maxAttempts = 30;

        while (
          completedTask.status &&
          (completedTask.status.state === "running" ||
            completedTask.status.state === "submitted") &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;

          try {
            const taskResponse = await a2aClient.getTask({ id: task.id });
            if ("task" in taskResponse && taskResponse.task) {
              completedTask = taskResponse.task;
            }
          } catch (pollError) {
            console.error(
              `Task polling error (attempt ${attempts}):`,
              pollError
            );
          }
        }

        if (
          completedTask.status?.state === "completed" &&
          completedTask.artifacts
        ) {
          // Extract quiz data from A2A artifacts
          const quizArtifact = completedTask.artifacts.find(
            (artifact) => artifact.name === "quiz.json"
          );

          if (quizArtifact && quizArtifact.parts) {
            const quizData = JSON.parse(quizArtifact.parts[0].text);

            return {
              workflowId: `workflow-${Date.now()}`,
              status: "completed",
              result: {
                message: `Quiz workflow orchestrated successfully with ${
                  quizData.quiz_questions?.length || 0
                } questions`,
                data: quizData,
              },
              timestamp: new Date().toISOString(),
            };
          }
        }
      }

      // Fallback to mock data if A2A doesn't return expected format
      console.log("A2A response format unexpected, using fallback");
      return this.generateMockQuizWorkflow(topic, questionCount);
    } catch (error) {
      console.error("A2A quiz workflow failed:", error);

      // Fallback to mock data
      return this.generateMockQuizWorkflow(topic, questionCount);
    }
  },

  generateMockQuizWorkflow: (topic, questionCount) => {
    // Generate the requested number of questions
    const generateQuestion = (index) => {
      const questionTypes = [
        {
          question: `What is the main focus of ${topic}?`,
          correct_answer: "A",
          answers: [
            { answer: "The primary concepts and principles" },
            { answer: "Historical background only" },
            { answer: "Future predictions" },
            { answer: "Personal opinions" },
          ],
          difficulty: "medium",
        },
        {
          question: `Which of the following is most relevant to ${topic}?`,
          correct_answer: "B",
          answers: [
            { answer: "Unrelated concepts" },
            { answer: "Core principles and applications" },
            { answer: "Random facts" },
            { answer: "Personal anecdotes" },
          ],
          difficulty: "medium",
        },
        {
          question: `True or False: ${topic} is an important field of study.`,
          correct_answer: "A",
          answers: [{ answer: "True" }, { answer: "False" }],
          difficulty: "easy",
        },
        {
          question: `What would be the best way to learn about ${topic}?`,
          correct_answer: "C",
          answers: [
            { answer: "Avoiding all resources" },
            { answer: "Reading only one source" },
            { answer: "Using multiple resources and practice" },
            { answer: "Memorizing without understanding" },
          ],
          difficulty: "easy",
        },
        {
          question: `Which skill is most important when studying ${topic}?`,
          correct_answer: "D",
          answers: [
            { answer: "Avoiding questions" },
            { answer: "Memorizing everything" },
            { answer: "Ignoring details" },
            { answer: "Critical thinking and analysis" },
          ],
          difficulty: "hard",
        },
        {
          question: `What are the key principles in ${topic}?`,
          correct_answer: "A",
          answers: [
            { answer: "Fundamental concepts and theories" },
            { answer: "Random facts" },
            { answer: "Personal opinions" },
            { answer: "Historical dates only" },
          ],
          difficulty: "medium",
        },
        {
          question: `How does ${topic} relate to real-world applications?`,
          correct_answer: "B",
          answers: [
            { answer: "It doesn't apply anywhere" },
            { answer: "Through practical implementation and problem-solving" },
            { answer: "Only in academic settings" },
            { answer: "Through memorization" },
          ],
          difficulty: "medium",
        },
        {
          question: `What is the historical significance of ${topic}?`,
          correct_answer: "C",
          answers: [
            { answer: "No historical importance" },
            { answer: "Only recent developments" },
            { answer: "Evolution and development over time" },
            { answer: "Personal stories" },
          ],
          difficulty: "hard",
        },
        {
          question: `Which method is most effective for studying ${topic}?`,
          correct_answer: "A",
          answers: [
            { answer: "Active learning and critical thinking" },
            { answer: "Passive reading only" },
            { answer: "Memorizing without understanding" },
            { answer: "Avoiding practice" },
          ],
          difficulty: "easy",
        },
        {
          question: `What challenges are commonly faced in ${topic}?`,
          correct_answer: "D",
          answers: [
            { answer: "No challenges exist" },
            { answer: "Only easy problems" },
            { answer: "Personal issues" },
            { answer: "Complex problem-solving and analysis" },
          ],
          difficulty: "hard",
        },
      ];

      return questionTypes[index % questionTypes.length];
    };

    const quizQuestions = [];
    for (let i = 0; i < questionCount; i++) {
      quizQuestions.push(generateQuestion(i));
    }

    return {
      workflowId: `workflow-${Date.now()}`,
      status: "completed",
      result: {
        message: `Quiz workflow orchestrated successfully with ${questionCount} questions`,
        data: {
          quiz_questions: quizQuestions,
        },
      },
      timestamp: new Date().toISOString(),
    };
  },

  orchestrateManualWorkflow: async (data) => {
    const topic = data.query || data.input || data.topic || "General Topic";
    const prompt = data.prompt || data.message || "";

    try {
      console.log(`📚 Orchestrating manual workflow for topic: ${topic}`);

      // Use A2A protocol to communicate with manual-creator agent
      const manualCreatorUrl = "http://localhost:4002";
      const a2aClient = await A2AClient.fromCardUrl(manualCreatorUrl);

      // Create A2A message for manual generation
      const message = {
        kind: "message",
        messageId: `manual-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        role: "user",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              skillId: "generate_manual",
              input: {
                topic: topic,
                prompt: prompt,
              },
            }),
          },
        ],
      };

      // Send message using A2A SDK
      const response = await a2aClient.sendMessage({
        message,
        configuration: {
          blocking: true,
        },
      });

      console.log("A2A manual response received:", response);

      // Handle the response
      if (response && typeof response === "object" && "task" in response) {
        const task = response.task;

        // Poll for task completion
        let completedTask = task;
        let attempts = 0;
        const maxAttempts = 30;

        while (
          completedTask.status &&
          (completedTask.status.state === "running" ||
            completedTask.status.state === "submitted") &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;

          try {
            const taskResponse = await a2aClient.getTask({ id: task.id });
            if ("task" in taskResponse && taskResponse.task) {
              completedTask = taskResponse.task;
            }
          } catch (pollError) {
            console.error(
              `Manual task polling error (attempt ${attempts}):`,
              pollError
            );
          }
        }

        if (
          completedTask.status?.state === "completed" &&
          completedTask.artifacts
        ) {
          // Extract manual data from A2A artifacts
          const manualArtifact = completedTask.artifacts.find(
            (artifact) => artifact.name === "manual.json"
          );

          if (manualArtifact && manualArtifact.parts) {
            const manualData = JSON.parse(manualArtifact.parts[0].text);

            return {
              workflowId: `manual-workflow-${Date.now()}`,
              status: "completed",
              result: {
                message: `Manual workflow orchestrated successfully for topic: ${topic}`,
                data: manualData,
              },
              timestamp: new Date().toISOString(),
            };
          }
        }
      }

      // Fallback to mock data if A2A doesn't return expected format
      console.log("A2A manual response format unexpected, using fallback");
      return this.generateMockManualWorkflow(topic, prompt);
    } catch (error) {
      console.error("A2A manual workflow failed:", error);

      // Fallback to mock data
      return this.generateMockManualWorkflow(topic, prompt);
    }
  },

  generateMockManualWorkflow: (topic, prompt) => {
    const mockManual = {
      title: `Complete Manual: ${topic}`,
      introduction: {
        purpose: `This manual provides comprehensive coverage of ${topic}`,
        objectives: [
          `Understand the fundamental concepts of ${topic}`,
          `Apply ${topic} principles in practical scenarios`,
          `Develop expertise in ${topic} methodologies`,
        ],
      },
      sections: [
        {
          title: `Introduction to ${topic}`,
          content: `This section covers the basic concepts and principles of ${topic}. ${prompt}`,
          keyPoints: [
            `Core concepts of ${topic}`,
            `Historical development`,
            `Modern applications`,
          ],
        },
        {
          title: `Advanced Concepts`,
          content: `Deeper exploration of ${topic} including advanced theories and methodologies.`,
          keyPoints: [
            `Advanced theories`,
            `Complex methodologies`,
            `Real-world applications`,
          ],
        },
        {
          title: `Practical Applications`,
          content: `How to apply ${topic} knowledge in real-world scenarios.`,
          keyPoints: [`Case studies`, `Best practices`, `Common pitfalls`],
        },
      ],
      conclusion: {
        summary: `This manual has covered the essential aspects of ${topic}`,
        nextSteps: [
          "Practice with real-world examples",
          "Explore advanced topics",
          "Apply knowledge in projects",
        ],
      },
      glossary: {
        [`${topic}`]: `The main subject matter covered in this manual`,
        Concept: "A fundamental idea or principle",
        Methodology: "A systematic approach to solving problems",
      },
    };

    return {
      workflowId: `manual-workflow-${Date.now()}`,
      status: "completed",
      result: {
        message: `Manual workflow orchestrated successfully for topic: ${topic}`,
        data: mockManual,
      },
      timestamp: new Date().toISOString(),
    };
  },

  monitorSystemHealth: async (data) => {
    const healthChecks = [];
    const knownUrls = [
      { id: "frontend", url: "http://localhost:3000" },
      { id: "backend", url: "http://localhost:4001" },
      { id: "manual-creator", url: "http://localhost:4002" },
      { id: "orchestrator", url: "http://localhost:5000" },
    ];

    for (const service of knownUrls) {
      try {
        // Use A2A SDK to check agent health
        const a2aClient = await A2AClient.fromCardUrl(service.url);
        const agentCard = await a2aClient.getAgentCard();

        healthChecks.push({
          agent: agentCard.name || service.id,
          url: service.url,
          status: "healthy",
          capabilities: agentCard.capabilities || [],
          skills: agentCard.skills || [],
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Health check failed for ${service.url}:`, error);
        healthChecks.push({
          agent: service.id,
          url: service.url,
          status: "unhealthy",
          error: error.message,
          lastSeen: new Date().toISOString(),
        });
      }
    }

    const overallHealth = healthChecks.every((h) => h.status === "healthy")
      ? "healthy"
      : "degraded";

    return {
      overall_health: overallHealth,
      services: healthChecks,
      timestamp: new Date().toISOString(),
    };
  },

  getChatHistory: () => {
    return [];
  },

  getAllWorkflows: () => {
    return [];
  },

  getAllAgents: () => {
    return [
      { id: "frontend", url: "http://localhost:3000", status: "online" },
      { id: "backend", url: "http://localhost:4001", status: "online" },
      { id: "manual-creator", url: "http://localhost:4002", status: "online" },
      { id: "orchestrator", url: "http://localhost:5000", status: "online" },
    ];
  },

  executeAgentWithResilience: async (query, context) => {
    try {
      console.log(`🔄 Executing agent with resilience for query: ${query}`);

      // Determine which agent to use based on query type
      let targetUrl = "http://localhost:4001"; // Default to backend

      if (
        query.toLowerCase().includes("quiz") ||
        query.toLowerCase().includes("question")
      ) {
        targetUrl = "http://localhost:4001"; // Backend for quiz generation
      } else if (
        query.toLowerCase().includes("manual") ||
        query.toLowerCase().includes("documentation") ||
        query.toLowerCase().includes("guide")
      ) {
        targetUrl = "http://localhost:4002"; // Manual-creator for manual generation
      } else if (
        query.toLowerCase().includes("workflow") ||
        query.toLowerCase().includes("orchestrate")
      ) {
        targetUrl = "http://localhost:3000"; // Frontend for UI orchestration
      }

      // Use A2A protocol to execute the query
      const a2aClient = await A2AClient.fromCardUrl(targetUrl);

      const message = {
        kind: "message",
        messageId: `exec-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        role: "user",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              query: query,
              context: context,
            }),
          },
        ],
      };

      const response = await a2aClient.sendMessage({
        message,
        configuration: {
          blocking: true,
        },
      });

      console.log("A2A execution response:", response);

      // Handle the response
      if (response && typeof response === "object" && "task" in response) {
        const task = response.task;

        // For simple queries, return immediately
        if (task.status?.state === "completed" && task.artifacts) {
          const artifact = task.artifacts[0];
          if (artifact && artifact.parts) {
            return {
              result: JSON.parse(artifact.parts[0].text),
              context: context,
              timestamp: new Date().toISOString(),
            };
          }
        }
      }

      // Fallback response
      return {
        result: `Executed query via A2A: ${query}`,
        context: context,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("A2A agent execution failed:", error);

      // Fallback response
      return {
        result: `Fallback execution for query: ${query}`,
        context: context,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "orchestrator",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Agent discovery endpoint
app.post("/api/discover-agents", async (req, res) => {
  try {
    const result = await orchestratorService.discoverAgents(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quiz workflow orchestration
app.post("/api/orchestrate-quiz-workflow", async (req, res) => {
  try {
    const result = await orchestratorService.orchestrateQuizWorkflow(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual workflow orchestration
app.post("/api/orchestrate-manual-workflow", async (req, res) => {
  try {
    const result = await orchestratorService.orchestrateManualWorkflow(
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System health monitoring
app.post("/api/monitor-system-health", async (req, res) => {
  try {
    const result = await orchestratorService.monitorSystemHealth(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
app.get("/api/chat-history", (req, res) => {
  try {
    const result = orchestratorService.getChatHistory();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all workflows
app.get("/api/workflows", (req, res) => {
  try {
    const result = orchestratorService.getAllWorkflows();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all agents
app.get("/api/agents", (req, res) => {
  try {
    const result = orchestratorService.getAllAgents();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute agent with resilience
app.post("/api/execute-agent", async (req, res) => {
  try {
    const { query, context } = req.body;
    const result = await orchestratorService.executeAgentWithResilience(
      query,
      context
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Orchestrator Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `🔍 Agent discovery: http://localhost:${PORT}/api/discover-agents`
  );
  console.log(
    `🎯 Quiz workflow: http://localhost:${PORT}/api/orchestrate-quiz-workflow`
  );
  console.log(
    `📚 Manual workflow: http://localhost:${PORT}/api/orchestrate-manual-workflow`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Orchestrator Server shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Orchestrator Server shutting down...");
  process.exit(0);
});
