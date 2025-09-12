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
   * Get agent card from URL
   */
  private async getAgentCard(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${url}/.well-known/agent-card.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
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
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep): Promise<any> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent ${step.agentId} not found`);
    }

    // Submit task to agent
    const response = await fetch(
      `${step.agentId}/api/actions/${step.skillId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillId: step.skillId,
          input: step.input,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Agent call failed: ${response.status}`);
    }

    return await response.json();
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
