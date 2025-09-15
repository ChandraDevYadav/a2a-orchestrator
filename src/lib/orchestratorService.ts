import { v4 as uuidv4 } from "uuid";
import {
  EnhancedAgentSelector,
  AgentProfile,
  QueryContext,
} from "./enhanced-agent-selector";
import { AgentCircuitBreaker } from "./circuit-breaker";
import {
  DynamicAgentDiscovery,
  AgentDiscoveryConfig,
} from "./dynamic-agent-discovery";
import { EnvironmentAgentManager } from "./environment-agent-manager";

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

  // Legacy hardcoded URLs (for backward compatibility)
  private knownAgentUrls: string[] = [
    "http://localhost:3000", // Frontend agent (self)
    "http://localhost:4001", // Backend agent
    "http://localhost:5000", // Orchestrator agent (separate port)
  ];

  // Enhanced components
  private enhancedAgentSelector: EnhancedAgentSelector;
  private circuitBreaker: AgentCircuitBreaker;
  private retryAttempts: number = 3;
  private timeoutMs: number = 30000;

  // Dynamic discovery components
  private dynamicDiscovery: DynamicAgentDiscovery | null = null;
  private environmentManager: EnvironmentAgentManager;

  constructor() {
    // Initialize enhanced components
    this.enhancedAgentSelector = new EnhancedAgentSelector();
    this.circuitBreaker = new AgentCircuitBreaker();

    // Initialize environment-based agent management
    const environment = process.env.NODE_ENV || "development";
    this.environmentManager = new EnvironmentAgentManager(environment);

    this.startAgentDiscovery();
    this.initializeVirtualAgents();
    this.initializeEnhancedAgents();
    this.initializeDynamicDiscovery();
  }

  /**
   * Initialize enhanced agent profiles with capabilities
   */
  private initializeEnhancedAgents(): void {
    // Backend Quiz Agent
    const backendAgent: AgentProfile = {
      id: "backend-quiz-agent",
      name: "Quiz Generation Agent",
      url: "http://localhost:4001",
      capabilities: [
        {
          id: "quiz-generation",
          name: "Generate Quiz Questions",
          description: "Creates quiz questions on any topic",
          keywords: [
            "quiz",
            "question",
            "test",
            "exam",
            "assessment",
            "multiple choice",
            "generate",
            "create",
          ],
          confidence: 0.95,
          requirements: ["openai-api"],
        },
        {
          id: "content-analysis",
          name: "Content Analysis",
          description: "Analyzes and processes educational content",
          keywords: [
            "analyze",
            "content",
            "educational",
            "material",
            "process",
          ],
          confidence: 0.85,
        },
      ],
      status: "online",
      load: 0.0,
      responseTime: 2000,
      reliability: 0.95,
      lastSeen: new Date(),
    };

    // Frontend Agent
    const frontendAgent: AgentProfile = {
      id: "frontend-agent",
      name: "Frontend Orchestration Agent",
      url: "http://localhost:3000",
      capabilities: [
        {
          id: "ui-orchestration",
          name: "UI Orchestration",
          description: "Manages user interface and workflow coordination",
          keywords: [
            "workflow",
            "orchestrate",
            "coordinate",
            "manage",
            "ui",
            "interface",
            "display",
            "render",
          ],
          confidence: 0.9,
        },
        {
          id: "quiz-display",
          name: "Quiz Display",
          description: "Renders and manages quiz interfaces",
          keywords: ["display", "render", "show", "present", "quiz interface"],
          confidence: 0.88,
        },
      ],
      status: "online",
      load: 0.0,
      responseTime: 500,
      reliability: 0.98,
      lastSeen: new Date(),
    };

    // Virtual MCP Agent
    const mcpAgent: AgentProfile = {
      id: "virtual-mcp-agent",
      name: "General MCP Agent",
      url: "virtual://normal-mcp-agent",
      capabilities: [
        {
          id: "general-conversation",
          name: "General Conversation",
          description: "Handles general queries and conversations",
          keywords: [
            "help",
            "explain",
            "general",
            "conversation",
            "chat",
            "assist",
          ],
          confidence: 0.8,
        },
        {
          id: "information-retrieval",
          name: "Information Retrieval",
          description: "Retrieves and provides information",
          keywords: ["information", "retrieve", "lookup", "search", "find"],
          confidence: 0.75,
        },
      ],
      status: "online",
      load: 0.0,
      responseTime: 1000,
      reliability: 0.9,
      lastSeen: new Date(),
    };

    // Register all agents with enhanced selector
    this.enhancedAgentSelector.registerAgent(backendAgent);
    this.enhancedAgentSelector.registerAgent(frontendAgent);
    this.enhancedAgentSelector.registerAgent(mcpAgent);
  }

  /**
   * Initialize dynamic agent discovery based on environment
   */
  private initializeDynamicDiscovery(): void {
    const discoveryMethod = process.env.AGENT_DISCOVERY_METHOD || "environment";

    const discoveryConfig: AgentDiscoveryConfig = {
      discoveryMethod: discoveryMethod as any,
      environment: {
        prefix: process.env.AGENT_PREFIX || "QUIZ_AGENT",
        ports: this.parsePorts(process.env.AGENT_PORTS || "3000,4001,5000"),
        hosts: this.parseHosts(process.env.AGENT_HOSTS || "localhost"),
      },
      manual: {
        agents: this.environmentManager.getAllAgents().map((agent) => ({
          id: agent.id,
          url: agent.url,
          capabilities: agent.capabilities,
          metadata: agent.metadata,
        })),
      },
    };

    try {
      this.dynamicDiscovery = new DynamicAgentDiscovery(discoveryConfig);
      console.log(
        `Dynamic agent discovery initialized with method: ${discoveryMethod}`
      );
    } catch (error) {
      console.warn(
        "Failed to initialize dynamic discovery, falling back to environment manager:",
        error
      );
    }
  }

  /**
   * Parse comma-separated ports string
   */
  private parsePorts(portsString: string): number[] {
    return portsString
      .split(",")
      .map((port) => parseInt(port.trim()))
      .filter((port) => !isNaN(port));
  }

  /**
   * Parse comma-separated hosts string
   */
  private parseHosts(hostsString: string): string[] {
    return hostsString
      .split(",")
      .map((host) => host.trim())
      .filter((host) => host.length > 0);
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
   * Get all available agents (dynamic + legacy)
   */
  getAllAvailableAgents(): any[] {
    const agents: any[] = [];

    // Add dynamically discovered agents
    if (this.dynamicDiscovery) {
      agents.push(...this.dynamicDiscovery.getAllAgents());
    }

    // Add environment-managed agents
    agents.push(...this.environmentManager.getAllAgents());

    // Add legacy agents for backward compatibility
    const legacyAgents = Array.from(this.agents.values());
    agents.push(...legacyAgents);

    // Remove duplicates based on URL
    const uniqueAgents = agents.filter(
      (agent, index, self) =>
        index === self.findIndex((a) => a.url === agent.url)
    );

    return uniqueAgents;
  }

  /**
   * Get agents by capability with load balancing
   */
  getAgentsByCapability(capability: string): any[] {
    const agents: any[] = [];

    // Get from dynamic discovery
    if (this.dynamicDiscovery) {
      agents.push(...this.dynamicDiscovery.getAgentsByCapability(capability));
    }

    // Get from environment manager
    agents.push(...this.environmentManager.getAgentsByCapability(capability));

    // Get from legacy agents
    const legacyAgents = Array.from(this.agents.values()).filter((agent) =>
      agent.skills?.includes(capability)
    );
    agents.push(...legacyAgents);

    // Remove duplicates and return online agents only
    const uniqueAgents = agents.filter(
      (agent, index, self) =>
        index === self.findIndex((a) => a.url === agent.url)
    );

    return uniqueAgents.filter((agent) => agent.status === "online");
  }

  /**
   * Get load-balanced agent URL for a capability
   */
  getLoadBalancedAgentUrl(capability: string): string | null {
    // Try environment manager first (has load balancing)
    const envAgent = this.environmentManager.getLoadBalancedAgent(capability);
    if (envAgent) return envAgent;

    // Fall back to dynamic discovery
    if (this.dynamicDiscovery) {
      const dynamicAgents =
        this.dynamicDiscovery.getAgentsByCapability(capability);
      if (dynamicAgents.length > 0) {
        const index = Math.floor(Math.random() * dynamicAgents.length);
        return dynamicAgents[index].url;
      }
    }

    // Fall back to legacy hardcoded URLs
    switch (capability) {
      case "quiz-generation":
      case "content-analysis":
        return "http://localhost:4001";
      case "ui-orchestration":
      case "quiz-display":
        return "http://localhost:3000";
      default:
        return null;
    }
  }

  /**
   * Get primary agent URL for a capability
   */
  getPrimaryAgentUrl(capability: string): string | null {
    // Try environment manager first
    const envAgent = this.environmentManager.getPrimaryAgent(capability);
    if (envAgent) return envAgent;

    // Fall back to dynamic discovery
    if (this.dynamicDiscovery) {
      const dynamicAgents =
        this.dynamicDiscovery.getAgentsByCapability(capability);
      if (dynamicAgents.length > 0) {
        return dynamicAgents[0].url;
      }
    }

    // Fall back to legacy hardcoded URLs
    switch (capability) {
      case "quiz-generation":
      case "content-analysis":
        return "http://localhost:4001";
      case "ui-orchestration":
      case "quiz-display":
        return "http://localhost:3000";
      default:
        return null;
    }
  }

  /**
   * Enhanced agent selection using sophisticated scoring
   */
  determineAgentForQuery(
    query: string,
    context?: QueryContext
  ): {
    agent: AgentProfile | null;
    confidence: number;
    reasoning: string;
  } {
    const result = this.enhancedAgentSelector.selectAgent(query, context);

    // Add to chat history for transparency
    this.addChatMessage({
      type: "system",
      content: `Agent selection: ${
        result.agent?.name || "None"
      } (confidence: ${result.confidence.toFixed(2)}, reasoning: ${
        result.reasoning
      })`,
      metadata: {
        agentId: result.agent?.id,
        status: "selection_complete",
      },
    });

    return result;
  }

  /**
   * Legacy method for backward compatibility
   */
  determineAgentForQueryLegacy(query: string): AgentInfo | null {
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
   * Enhanced agent execution with circuit breaker and retry logic
   */
  async executeAgentWithResilience(
    query: string,
    context?: QueryContext
  ): Promise<{
    success: boolean;
    agent: AgentProfile | null;
    result?: any;
    error?: string;
    fallbackUsed?: boolean;
    metrics: {
      selectionTime: number;
      executionTime: number;
      totalTime: number;
    };
  }> {
    const startTime = Date.now();
    let selectionTime = 0;
    let executionTime = 0;

    try {
      // Step 1: Select primary agent using enhanced selector
      const selectionStart = Date.now();
      const { agent, confidence, reasoning } =
        this.enhancedAgentSelector.selectAgent(query, context);
      selectionTime = Date.now() - selectionStart;

      if (!agent) {
        return {
          success: false,
          agent: null,
          error: "No suitable agent found",
          metrics: {
            selectionTime,
            executionTime: 0,
            totalTime: Date.now() - startTime,
          },
        };
      }

      // Step 2: Check circuit breaker
      if (!this.circuitBreaker.isAgentAvailable(agent.id)) {
        console.warn(`Agent ${agent.id} is circuit-broken, trying fallback`);
        return await this.tryFallbackExecution(
          query,
          context,
          agent.id,
          startTime,
          selectionTime
        );
      }

      // Step 3: Execute with retry logic
      const executionStart = Date.now();
      const result = await this.executeWithRetry(agent, query, context);
      executionTime = Date.now() - executionStart;

      // Record success
      this.circuitBreaker.recordSuccess(agent.id);
      this.enhancedAgentSelector.updateAgentMetrics(
        agent.id,
        true,
        executionTime
      );

      return {
        success: true,
        agent,
        result,
        metrics: {
          selectionTime,
          executionTime,
          totalTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      // Record failure and try fallback
      const agent = this.enhancedAgentSelector.selectAgent(
        query,
        context
      ).agent;
      if (agent) {
        this.circuitBreaker.recordFailure(agent.id);
        this.enhancedAgentSelector.updateAgentMetrics(
          agent.id,
          false,
          executionTime
        );
      }

      return await this.tryFallbackExecution(
        query,
        context,
        agent?.id,
        startTime,
        selectionTime
      );
    }
  }

  /**
   * Execute agent with retry logic
   */
  private async executeWithRetry(
    agent: AgentProfile,
    query: string,
    context?: QueryContext
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        if (agent.url.startsWith("virtual://")) {
          return await this.executeVirtualAgent(agent, query, context);
        } else {
          return await this.executeRealAgent(agent, query, context);
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed for agent ${agent.id}:`, error);

        if (attempt < this.retryAttempts) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Try fallback agents if primary fails
   */
  private async tryFallbackExecution(
    query: string,
    context: QueryContext | undefined,
    excludeAgentId: string | undefined,
    startTime: number,
    selectionTime: number
  ): Promise<{
    success: boolean;
    agent: AgentProfile | null;
    result?: any;
    error?: string;
    fallbackUsed?: boolean;
    metrics: {
      selectionTime: number;
      executionTime: number;
      totalTime: number;
    };
  }> {
    const fallbackAgents = this.enhancedAgentSelector.getFallbackAgents(
      query,
      excludeAgentId
    );

    for (const agent of fallbackAgents) {
      if (!this.circuitBreaker.isAgentAvailable(agent.id)) continue;

      try {
        const executionStart = Date.now();
        const result = await this.executeWithRetry(agent, query, context);
        const executionTime = Date.now() - executionStart;

        this.circuitBreaker.recordSuccess(agent.id);
        this.enhancedAgentSelector.updateAgentMetrics(
          agent.id,
          true,
          executionTime
        );

        return {
          success: true,
          agent,
          result,
          fallbackUsed: true,
          metrics: {
            selectionTime,
            executionTime,
            totalTime: Date.now() - startTime,
          },
        };
      } catch (error) {
        this.circuitBreaker.recordFailure(agent.id);
        console.warn(`Fallback agent ${agent.id} also failed:`, error);
      }
    }

    return {
      success: false,
      agent: null,
      error: "All agents failed, including fallbacks",
      metrics: {
        selectionTime,
        executionTime: 0,
        totalTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Execute virtual agent (like MCP)
   */
  private async executeVirtualAgent(
    agent: AgentProfile,
    query: string,
    context?: QueryContext
  ): Promise<any> {
    // Use existing handleGeneralMCPQuery logic
    return await this.handleGeneralMCPQuery({ query, context });
  }

  /**
   * Execute real agent via A2A
   */
  private async executeRealAgent(
    agent: AgentProfile,
    query: string,
    context?: QueryContext
  ): Promise<any> {
    // Use existing A2A execution logic from executeStep
    const step = {
      id: "enhanced-step",
      agentId: agent.url,
      skillId: "enhanced-execution",
      input: { query, context },
      status: "running" as const,
    };

    return await this.executeStep(step);
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
   * Discover agents in the network using A2A protocol
   */
  async discoverAgents(requestData: any = {}): Promise<any> {
    const discoveredAgents: AgentInfo[] = [];

    console.log("🔍 Starting A2A agent discovery...");

    for (const url of this.knownAgentUrls) {
      try {
        console.log(`🔍 Discovering agent at ${url}...`);
        const agentCard = await this.getAgentCard(url);

        const agentInfo: AgentInfo = {
          name: agentCard.name || `Agent-${url.split(":").pop()}`,
          url: url,
          skills: agentCard.skills?.map((s: any) => s.id) || [],
          status: "online",
          lastSeen: new Date(),
          capabilities: agentCard.capabilities,
        };

        this.agents.set(url, agentInfo);
        discoveredAgents.push(agentInfo);

        console.log(
          `✅ Successfully discovered agent: ${agentInfo.name} at ${url}`
        );

        // Add discovery message to chat
        this.addChatMessage({
          type: "system",
          content: `Discovered agent: ${agentInfo.name} at ${url} with ${agentInfo.skills.length} skills`,
          metadata: {
            agentId: url,
            skillId: agentInfo.skills.join(","),
            status: "discovered",
          },
        });
      } catch (error) {
        console.error(`❌ Failed to discover agent at ${url}:`, error);

        const agentInfo: AgentInfo = {
          name: `Unknown Agent (${url})`,
          url: url,
          skills: [],
          status: "offline",
          lastSeen: new Date(),
        };
        this.agents.set(url, agentInfo);
        discoveredAgents.push(agentInfo);

        // Add failure message to chat
        this.addChatMessage({
          type: "system",
          content: `Failed to discover agent at ${url}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          metadata: { agentId: url, status: "offline" },
        });
      }
    }

    console.log(
      `🎯 Agent discovery completed. Found ${discoveredAgents.length} agents.`
    );

    return {
      agents: discoveredAgents,
      count: discoveredAgents.length,
      onlineCount: discoveredAgents.filter((a) => a.status === "online").length,
      offlineCount: discoveredAgents.filter((a) => a.status === "offline")
        .length,
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
      return await a2aClient.getAgentCard();
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
   * Execute a single workflow step using real A2A SDK with enhanced error handling
   */
  private async executeStep(step: WorkflowStep): Promise<any> {
    const agent = this.agents.get(step.agentId);
    if (!agent) {
      throw new Error(`Agent ${step.agentId} not found`);
    }

    try {
      console.log(`🔄 Executing step ${step.id} on agent ${step.agentId}`);

      // Import A2A client dynamically to avoid SSR issues
      const { A2AClient } = await import("@a2a-js/sdk/client");

      // Create A2A client using the agent URL
      const a2aClient = await A2AClient.fromCardUrl(step.agentId);

      // Create message with task input
      const message = {
        kind: "message" as const,
        messageId: uuidv4(),
        role: "user" as const,
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

      console.log(`A2A response for step ${step.id}:`, response);

      // Handle the response with enhanced error handling
      if (response && typeof response === "object" && "task" in response) {
        const task = response.task as any;

        // Poll for task completion with timeout
        let completedTask = task;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

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
            console.log(
              `A2A task polling attempt ${attempts} for step ${step.id}:`,
              taskResponse
            );

            if ("task" in taskResponse && taskResponse.task) {
              completedTask = taskResponse.task as any;
              console.log(
                `A2A task status for step ${step.id}: ${completedTask.status?.state}`
              );
            }
          } catch (pollError) {
            console.error(
              `A2A task polling error for step ${step.id} (attempt ${attempts}):`,
              pollError
            );
          }
        }

        if (attempts >= maxAttempts) {
          throw new Error(
            `A2A task polling timeout for step ${step.id} - task did not complete within 30 seconds`
          );
        }

        console.log(
          `A2A task completed for step ${step.id}:`,
          completedTask.status?.state
        );

        if (
          completedTask.status?.state === "completed" &&
          completedTask.artifacts
        ) {
          // Extract data from A2A artifacts
          const artifact = completedTask.artifacts[0];
          if (artifact && artifact.parts) {
            const result = JSON.parse(artifact.parts[0].text);
            console.log(`Step ${step.id} completed successfully:`, result);
            return result;
          }
        } else if (completedTask.status?.state === "failed") {
          console.error(`A2A task failed for step ${step.id}:`, completedTask);
          throw new Error(`A2A task execution failed for step ${step.id}`);
        } else {
          console.error(
            `A2A task not completed for step ${step.id}:`,
            completedTask
          );
          throw new Error(
            `A2A task status: ${completedTask.status?.state}, artifacts: ${
              completedTask.artifacts ? "present" : "missing"
            }`
          );
        }
      } else if (
        response &&
        typeof response === "object" &&
        "message" in response
      ) {
        // Handle direct message response
        const message = response.message as any;
        if (message.parts && message.parts.length > 0) {
          try {
            const result = JSON.parse(message.parts[0].text);
            console.log(
              `Step ${step.id} completed with direct message:`,
              result
            );
            return result;
          } catch (e) {
            // If not JSON, return the text as result
            console.log(
              `Step ${step.id} completed with text response:`,
              message.parts[0].text
            );
            return { result: message.parts[0].text };
          }
        }
      }

      throw new Error(
        `No valid response received from A2A agent for step ${step.id}`
      );
    } catch (error) {
      console.error(`A2A task execution failed for step ${step.id}:`, error);
      throw new Error(
        `A2A agent call failed for step ${step.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Enhanced system health monitoring with circuit breaker status
   */
  async monitorSystemHealth(requestData: any): Promise<any> {
    const healthChecks = [];
    const enhancedAgents = this.enhancedAgentSelector.getAllAgents();

    // Check enhanced agents
    for (const agent of enhancedAgents) {
      const breakerStatus = this.circuitBreaker.getStatus(agent.id);

      healthChecks.push({
        agent: agent.name,
        url: agent.url,
        status: agent.status,
        load: agent.load,
        reliability: agent.reliability,
        responseTime: agent.responseTime,
        circuitBreaker: breakerStatus,
        lastSeen: agent.lastSeen,
      });
    }

    // Check legacy agents
    const agentEntries = Array.from(this.agents.entries());
    for (let i = 0; i < agentEntries.length; i++) {
      const [url, agent] = agentEntries[i];

      // Skip if already checked in enhanced agents
      if (enhancedAgents.some((ea) => ea.url === url)) continue;

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
          circuitBreaker: null,
        });
      } catch (error) {
        healthChecks.push({
          agent: agent.name,
          url: url,
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
          circuitBreaker: null,
        });
      }
    }

    const overallHealth = healthChecks.every((h) => h.status === "healthy")
      ? "healthy"
      : "degraded";

    return {
      overall_health: overallHealth,
      agents: healthChecks,
      circuitBreakers: this.circuitBreaker.getAllStates(),
      enhanced_metrics: {
        totalAgents: enhancedAgents.length,
        onlineAgents: enhancedAgents.filter((a) => a.status === "online")
          .length,
        averageReliability:
          enhancedAgents.reduce((sum, a) => sum + a.reliability, 0) /
          enhancedAgents.length,
        averageResponseTime:
          enhancedAgents.reduce((sum, a) => sum + a.responseTime, 0) /
          enhancedAgents.length,
      },
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
