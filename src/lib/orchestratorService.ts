import { v4 as uuidv4 } from "uuid";

export interface AgentInfo {
  name: string;
  url: string;
  skills: string[];
  status: "online" | "offline" | "unknown";
  lastSeen: Date;
  capabilities?: any;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  skillId: string;
  input: any;
  dependencies?: string[];
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

export interface ChatMessage {
  id: string;
  type: "user" | "orchestrator" | "agent" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    workflowId?: string;
    agentId?: string;
    skillId?: string;
    status?: string;
  };
}

export class NextJSOrchestratorService {
  private agents: Map<string, AgentInfo> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private chatHistory: ChatMessage[] = [];
  private knownAgentUrls: string[] = [
    "http://localhost:3000", // Frontend agent (self)
    "http://localhost:4001", // Backend agent
  ];

  constructor() {
    this.startAgentDiscovery();
    this.initializeVirtualAgents();
  }

  /**
   * Initialize virtual MCP agents that don't have physical endpoints
   */
  private initializeVirtualAgents() {
    // Add the normal MCP agent as a virtual agent
    const normalMCPAgent: AgentInfo = {
      name: "General MCP Agent",
      url: "virtual://normal-mcp-agent",
      skills: [
        "general-conversation",
        "information-retrieval",
        "task-assistance",
      ],
      status: "online",
      lastSeen: new Date(),
      capabilities: {
        description:
          "Handles general queries, conversations, and non-quiz related tasks",
        type: "virtual",
      },
    };

    this.agents.set("virtual://normal-mcp-agent", normalMCPAgent);
  }

  /**
   * Determine which agent should handle a query based on content analysis
   */
  determineAgentForQuery(query: string): AgentInfo | null {
    const lowerQuery = query.toLowerCase();

    // Quiz-related queries go to backend agent
    if (
      lowerQuery.includes("quiz") ||
      lowerQuery.includes("question") ||
      lowerQuery.includes("test") ||
      lowerQuery.includes("exam") ||
      lowerQuery.includes("assessment") ||
      lowerQuery.includes("multiple choice")
    ) {
      return this.agents.get("http://localhost:4001") || null;
    }

    // Workflow/orchestration queries go to frontend agent
    if (
      lowerQuery.includes("workflow") ||
      lowerQuery.includes("orchestrate") ||
      lowerQuery.includes("coordinate") ||
      lowerQuery.includes("manage")
    ) {
      return this.agents.get("http://localhost:3000") || null;
    }

    // All other queries go to normal MCP agent
    return this.agents.get("virtual://normal-mcp-agent") || null;
  }

  /**
   * Handle general MCP queries that don't require specific agent routing
   */
  async handleGeneralMCPQuery(requestData: any): Promise<any> {
    const { query, context } = requestData;
    const chatMode = context?.chatMode || "quiz"; // Default to quiz mode

    // Add query to chat history
    this.addChatMessage({
      type: "user",
      content: query,
      metadata: { status: "processing" },
    });

    let response = "";
    let agentId = "";

    if (
      chatMode === "quiz" ||
      query.toLowerCase().includes("quiz") ||
      query.toLowerCase().includes("question")
    ) {
      // Quiz-focused responses
      agentId = "quiz-agent";

      if (query.toLowerCase().includes("create quiz")) {
        response = `Great! I'd love to help you create a quiz. What topic would you like the quiz to cover? 

**Examples you can try:**
• "Create a quiz about the solar system"
• "Make a science quiz about photosynthesis" 
• "Generate a history quiz about the Renaissance"
• "Create a math quiz about algebra"
• "Make a quiz about JavaScript programming"

Just tell me the topic and I'll create 20 multiple-choice questions for you!`;
      } else if (query.toLowerCase().includes("science")) {
        response = `Perfect! I can create science quizzes on any topic. Here are some examples:

**Science Quiz Topics:**
• "Create a quiz about the solar system and planets"
• "Make a biology quiz about human anatomy"
• "Generate a chemistry quiz about periodic table"
• "Create a physics quiz about Newton's laws"
• "Make an astronomy quiz about stars and galaxies"

What specific science topic interests you? I can generate multiple choice questions, true/false, or short answer questions.`;
      } else if (query.toLowerCase().includes("history")) {
        response = `Excellent choice! I can create history quizzes covering any time period or region. Here are some examples:

**History Quiz Topics:**
• "Create a quiz about World War II"
• "Make a quiz about ancient Egypt"
• "Generate a quiz about the American Revolution"
• "Create a quiz about the Renaissance period"
• "Make a quiz about medieval times"

What historical period or event would you like to focus on?`;
      } else if (query.toLowerCase().includes("math")) {
        response = `Math quizzes are my specialty! I can create questions covering any math topic. Here are some examples:

**Math Quiz Topics:**
• "Create a quiz about algebra and equations"
• "Make a geometry quiz about shapes and angles"
• "Generate a calculus quiz about derivatives"
• "Create a statistics quiz about probability"
• "Make a quiz about fractions and decimals"

What level and type of math problems would you like? I can make them as easy or challenging as you need.`;
      } else if (query.toLowerCase().includes("general knowledge")) {
        response = `General knowledge quizzes are fun! I can create questions covering many topics. Here are some examples:

**General Knowledge Topics:**
• "Create a quiz about world capitals"
• "Make a quiz about famous landmarks"
• "Generate a quiz about literature and authors"
• "Create a quiz about sports and athletes"
• "Make a quiz about technology and inventions"

What area of general knowledge would you like to test?`;
      } else {
        response = `I'm your Quiz Agent! I can help you create quizzes on any topic. Here's how to get started:

**Quick Start Options:**
• Click any suggested button above (Create Quiz, Science Topics, etc.)
• Type "Create a quiz about [your topic]"
• Paste content and ask me to make a quiz from it

**Examples:**
• "Create a quiz about the solar system"
• "Make a science quiz about photosynthesis"
• "Generate a history quiz about World War II"
• "Create a math quiz about algebra"

What would you like to quiz about?`;
      }
    } else if (
      query.toLowerCase().includes("help") ||
      query.toLowerCase().includes("plan") ||
      query.toLowerCase().includes("explain")
    ) {
      // Help/planning mode - provide guidance without needing backend
      agentId = "quiz-agent";
      response = `I'm your Quiz Agent! I can help you plan and design quizzes even when the generation service is temporarily unavailable.

**I can help you with:**
• Planning quiz topics and structure
• Suggesting question types and formats
• Explaining quiz creation best practices
• Brainstorming quiz content ideas
• Reviewing quiz concepts

**What would you like help with?**
• "Help me plan a science quiz about photosynthesis"
• "What topics should I include in a history quiz about World War II?"
• "Explain how to write good multiple choice questions"
• "Suggest quiz formats for different subjects"

How can I assist you with quiz planning today?`;
    } else {
      // General chat mode
      agentId = "normal-mcp-agent";
      response = `I'm your Quiz Agent, but I can also help with general questions! You asked: "${query}". 

I'm here to assist with quiz creation, planning, and answering any questions you have. Even if the quiz generation service is temporarily unavailable, I can still help you plan quizzes and answer questions about quiz creation.

How can I help you today?`;
    }

    this.addChatMessage({
      type: "agent",
      content: response,
      metadata: {
        agentId: agentId,
        status: "completed",
      },
    });

    return {
      success: true,
      response,
      agent: { name: "Quiz Agent" },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Start periodic agent discovery
   */
  private startAgentDiscovery() {
    // Initial discovery
    this.discoverAgents();

    // Periodic discovery every 30 seconds
    setInterval(() => {
      this.discoverAgents();
    }, 30000);
  }

  /**
   * Discover agents in the network
   */
  async discoverAgents(requestData: any = {}): Promise<any> {
    const discoveredAgents: AgentInfo[] = [];

    for (const url of this.knownAgentUrls) {
      try {
        const agentCard = await this.getAgentCard(url);
        const agentInfo: AgentInfo = {
          name: agentCard.name,
          url: url,
          skills: agentCard.skills?.map((s: any) => s.id) || [],
          status: "online",
          lastSeen: new Date(),
          capabilities: agentCard.capabilities,
        };

        this.agents.set(url, agentInfo);
        discoveredAgents.push(agentInfo);

        // Add discovery message to chat
        this.addChatMessage({
          type: "system",
          content: `Discovered agent: ${agentCard.name} at ${url}`,
          metadata: { agentId: url },
        });
      } catch (error) {
        console.error(`Failed to discover agent at ${url}:`, error);
        const agentInfo: AgentInfo = {
          name: `Unknown Agent (${url})`,
          url: url,
          skills: [],
          status: "offline",
          lastSeen: new Date(),
        };
        this.agents.set(url, agentInfo);
      }
    }

    return {
      agents: discoveredAgents,
      count: discoveredAgents.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get agent card from URL using A2A SDK
   */
  private async getAgentCard(url: string): Promise<any> {
    try {
      // Import A2A client dynamically to avoid SSR issues
      const { A2AClient } = await import("@a2a-js/sdk/client");

      // Create A2A client using fromCardUrl static method
      const a2aClient = await A2AClient.fromCardUrl(url);

      // Return the agent card from the client
      return a2aClient.agentCard;
    } catch (error) {
      console.error("Failed to get agent card via A2A SDK:", error);

      // Fallback to direct fetch if A2A SDK fails
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${url}/.well-known/agent-card.json`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.json();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }
  }

  /**
   * Orchestrate complete quiz workflow with chat integration
   *
   * This method coordinates the entire quiz generation process by:
   * 1. Creating a workflow with predefined steps
   * 2. Executing steps in dependency order
   * 3. Providing real-time chat updates throughout the process
   * 4. Handling errors and providing feedback
   *
   * @param requestData - Contains topic, difficulty, and question_count
   * @returns Promise with workflow results and status
   */
  async orchestrateQuizWorkflow(requestData: any): Promise<any> {
    // Generate unique workflow ID using timestamp for uniqueness
    const workflowId = `workflow_${Date.now()}`;

    // Extract and set default values for quiz parameters
    const {
      topic, // Required: The subject matter for the quiz
      difficulty = "intermediate", // Default difficulty level
      question_count = 5, // Default number of questions to generate
    } = requestData;

    try {
      // Notify chat system that workflow is starting
      // This provides user feedback and maintains audit trail
      this.addChatMessage({
        type: "orchestrator",
        content: `Starting quiz workflow for topic: "${topic}"`,
        metadata: { workflowId, status: "starting" },
      });

      // Define the workflow structure with two sequential steps:
      // Step 1: Generate quiz questions (backend agent)
      // Step 2: Display quiz (frontend agent)
      const workflow: Workflow = {
        id: workflowId,
        name: `Quiz Generation: ${topic}`,
        steps: [
          {
            id: "step_1",
            agentId: "http://localhost:4001", // Backend agent URL
            skillId: "generate-quiz", // Skill to generate quiz questions
            input: { topic, difficulty, question_count }, // Parameters for quiz generation
            status: "pending", // Initial status
          },
          {
            id: "step_2",
            agentId: "http://localhost:3000", // Frontend agent URL (self)
            skillId: "display_quiz", // Skill to display the generated quiz
            input: {}, // No additional input needed
            dependencies: ["step_1"], // Must wait for step 1 to complete
            status: "pending", // Initial status
          },
        ],
        status: "running", // Workflow is now active
        createdAt: new Date(), // Track when workflow was created
      };

      // Store workflow in memory for tracking and management
      this.workflows.set(workflowId, workflow);

      // Execute the workflow steps in dependency order with chat integration
      // This method handles step execution, dependency checking, and chat updates
      const result = await this.executeWorkflowWithChat(workflowId);

      // Notify chat system of successful completion
      // Provides user feedback on the number of questions generated
      this.addChatMessage({
        type: "orchestrator",
        content: `Quiz workflow completed successfully! Generated ${result.length} questions.`,
        metadata: { workflowId, status: "completed" },
      });

      // Return structured response with workflow details
      return {
        workflow_id: workflowId,
        status: "completed",
        result: result, // Array of generated quiz questions
        timestamp: new Date().toISOString(), // ISO timestamp for tracking
      };
    } catch (error) {
      // Log error for debugging purposes
      console.error("Workflow orchestration failed:", error);

      // Notify chat system of workflow failure
      // Provides user feedback on what went wrong
      this.addChatMessage({
        type: "orchestrator",
        content: `Workflow failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        metadata: { workflowId, status: "failed" },
      });

      // Re-throw error to be handled by calling code
      throw error;
    }
  }

  /**
   * Execute workflow with chat integration
   */
  private async executeWorkflowWithChat(workflowId: string): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const results: any[] = [];

    for (const step of workflow.steps) {
      try {
        // Add step start message to chat
        this.addChatMessage({
          type: "orchestrator",
          content: `Executing step: ${step.skillId} on ${step.agentId}`,
          metadata: {
            workflowId,
            agentId: step.agentId,
            skillId: step.skillId,
            status: "running",
          },
        });

        // Check dependencies
        if (step.dependencies) {
          const dependencyResults = step.dependencies.map((depId) => {
            const depStep = workflow.steps.find((s) => s.id === depId);
            return depStep?.result;
          });

          if (dependencyResults.some((r) => !r)) {
            throw new Error(`Dependencies not met for step ${step.id}`);
          }
        }

        // Execute step
        step.status = "running";
        const result = await this.executeStep(step);
        step.result = result;
        step.status = "completed";
        results.push(result);

        // Add step completion message to chat
        this.addChatMessage({
          type: "agent",
          content: `Step completed: ${step.skillId}`,
          metadata: {
            workflowId,
            agentId: step.agentId,
            skillId: step.skillId,
            status: "completed",
          },
        });
      } catch (error) {
        step.status = "failed";
        workflow.status = "failed";

        // Add step failure message to chat
        this.addChatMessage({
          type: "agent",
          content: `Step failed: ${step.skillId} - ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          metadata: {
            workflowId,
            agentId: step.agentId,
            skillId: step.skillId,
            status: "failed",
          },
        });

        throw error;
      }
    }

    workflow.status = "completed";
    workflow.completedAt = new Date();

    return results;
  }

  /**
   * Execute a single workflow step using real A2A SDK
   */
  private async executeStep(step: WorkflowStep): Promise<any> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent ${step.agentId} not found`);
    }

    try {
      // Import A2A client dynamically to avoid SSR issues
      const { A2AClient } = await import("@a2a-js/sdk/client");

      // Create A2A client using the agent URL
      const a2aClient = await A2AClient.fromCardUrl(step.agentId);

      // Create message with task input
      const message = {
        parts: [
          {
            kind: "text" as const,
            text: JSON.stringify({
              skillId: step.skillId,
              input: step.input,
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

      // Handle the response
      if (response && typeof response === "object" && "artifacts" in response) {
        const completedTask = response as any;

        if (
          completedTask.status?.state === "completed" &&
          completedTask.artifacts
        ) {
          // Extract data from A2A artifacts
          const artifact = completedTask.artifacts[0];
          if (artifact && artifact.parts) {
            return JSON.parse(artifact.parts[0].text);
          }
        }
      }

      throw new Error("Task did not complete successfully or no data found");
    } catch (error) {
      console.error("A2A task execution failed:", error);
      throw new Error(
        `A2A agent call failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Monitor system health
   */
  async monitorSystemHealth(requestData: any): Promise<any> {
    const healthChecks = [];

    const agentEntries = Array.from(this.agents.entries());

    for (let i = 0; i < agentEntries.length; i++) {
      const [url, agent] = agentEntries[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${url}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        healthChecks.push({
          agent: agent.name,
          url: url,
          status: "healthy",
          response_time: response.headers.get("x-response-time") || "unknown",
        });
      } catch (error) {
        healthChecks.push({
          agent: agent.name,
          url: url,
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const overallHealth = healthChecks.every((h) => h.status === "healthy")
      ? "healthy"
      : "degraded";

    return {
      overall_health: overallHealth,
      agents: healthChecks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add message to chat history
   */
  addChatMessage(message: Omit<ChatMessage, "id" | "timestamp">) {
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      ...message,
    };
    this.chatHistory.push(chatMessage);
    return chatMessage;
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  /**
   * Get chat history for a specific workflow
   */
  getWorkflowChatHistory(workflowId: string): ChatMessage[] {
    return this.chatHistory.filter(
      (msg) => msg.metadata?.workflowId === workflowId
    );
  }

  /**
   * Clear chat history
   */
  clearChatHistory() {
    this.chatHistory = [];
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by URL
   */
  getAgent(url: string): AgentInfo | undefined {
    return this.agents.get(url);
  }
}
