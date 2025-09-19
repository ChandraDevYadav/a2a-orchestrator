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
    "http://localhost:3000/.well-known/agent-card.json", // Frontend agent (self)
    "http://localhost:4001/.well-known/agent-card.json", // Backend agent
    "http://localhost:4002/.well-known/agent-card.json", // Manual-creator agent
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
   * Most important function in the orchestrator service
   * Centralized decision maker - determines whether to route to Backend or DeepSeek
   */
  async handleCentralizedRequest(requestData: any): Promise<any> {
    const { query, context } = requestData;

    // Add query to chat history
    this.addChatMessage({
      type: "user",
      content: query,
      metadata: { status: "processing" },
    });

    try {
      // Use DeepSeek AI to classify the request
      const requestType = await this.classifyRequestType(query);

      if (requestType === "quiz") {
        // Route to Backend Agent for quiz generation
        console.log("🎯 Orchestrator Decision: Quiz Request → Backend Agent");
        return await this.routeToBackendAgent(query, context);
      } else if (requestType === "manual") {
        // Route to Manual Generation
        console.log(
          "📖 Orchestrator Decision: Manual Request → Manual Generator"
        );
        return await this.routeToManualGenerator(query, context);
      } else {
        // Route to DeepSeek API for general chat
        console.log("💬 Orchestrator Decision: Chat Request → DeepSeek API");
        return await this.routeToDeepSeekAPI(query, context);
      }
    } catch (error) {
      console.error("Error in centralized request handling:", error);

      // Fallback to simple pattern matching
      const lowerQuery = query.toLowerCase();
      const isQuizFallback =
        (lowerQuery.includes("create") && lowerQuery.includes("quiz")) ||
        (lowerQuery.includes("generate") && lowerQuery.includes("quiz")) ||
        (lowerQuery.includes("make") && lowerQuery.includes("quiz")) ||
        lowerQuery.includes("quiz about") ||
        lowerQuery.includes("quiz on");

      const isManualFallback =
        (lowerQuery.includes("create") && lowerQuery.includes("manual")) ||
        (lowerQuery.includes("generate") && lowerQuery.includes("manual")) ||
        (lowerQuery.includes("make") && lowerQuery.includes("manual")) ||
        (lowerQuery.includes("write") && lowerQuery.includes("manual")) ||
        lowerQuery.includes("manual about") ||
        lowerQuery.includes("manual on") ||
        lowerQuery.includes("documentation about") ||
        lowerQuery.includes("guide about");

      try {
        if (isQuizFallback) {
          return await this.routeToBackendAgent(query, context);
        } else if (isManualFallback) {
          return await this.routeToManualGenerator(query, context);
        } else {
          return await this.routeToDeepSeekAPI(query, context);
        }
      } catch (fallbackError) {
        console.error("Fallback routing also failed:", fallbackError);

        // Ultimate fallback - return a simple response
        this.addChatMessage({
          type: "agent",
          content:
            "I apologize, but I'm experiencing technical difficulties. Please try again later or rephrase your request.",
          metadata: { agentId: "fallback-agent", status: "error" },
        });

        return {
          type: "error",
          response:
            "I apologize, but I'm experiencing technical difficulties. Please try again later or rephrase your request.",
          agentId: "fallback-agent",
          chatHistory: this.getChatHistory(),
        };
      }
    }
  }

  /**
   * Classify request type using DeepSeek AI
   */
  private async classifyRequestType(
    query: string
  ): Promise<"quiz" | "manual" | "chat"> {
    try {
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;

      const client = new OpenAI({
        apiKey: "sk-6796ea0f38c7499dbf47c7ff2a026966",
        baseURL: "https://api.deepseek.com",
      });

      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a classifier that determines the type of user request. Return ONLY one of these three options: "quiz", "manual", or "chat".

Examples of quiz requests:
- "create a quiz about science"
- "generate a quiz on history"
- "make a quiz for math"
- "quiz about programming"
- "create questions about biology"

Examples of manual requests:
- "create a manual about React"
- "generate documentation for Python"
- "write a guide about cooking"
- "manual about JavaScript"
- "documentation about machine learning"

Examples of chat requests:
- "hello"
- "what is photosynthesis?"
- "help me understand calculus"
- "tell me about the weather"
- "how are you?"`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content
        ?.toLowerCase()
        .trim();

      if (response === "quiz") return "quiz";
      if (response === "manual") return "manual";
      return "chat";
    } catch (error) {
      console.error("DeepSeek classification error:", error);
      throw error;
    }
  }

  /**
   * Classify request using DeepSeek AI (legacy method for backward compatibility)
   */
  private async classifyRequest(query: string): Promise<boolean> {
    try {
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;

      const client = new OpenAI({
        apiKey: "sk-6796ea0f38c7499dbf47c7ff2a026966",
        baseURL: "https://api.deepseek.com",
      });

      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a classifier that determines if a user message is requesting quiz creation.

Return ONLY "true" or "false" based on whether the user wants to create a quiz.

Examples of quiz requests:
- "create a quiz about science"
- "generate a quiz on history"
- "make a quiz for math"
- "quiz about programming"
- "create questions about biology"

Examples of NOT quiz requests:
- "hello"
- "what is photosynthesis?"
- "help me understand calculus"
- "tell me about the weather"
- "how are you?"`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content
        ?.toLowerCase()
        .trim();
      console.log("DeepSeek classification response:", response);
      return response === "true";
    } catch (error) {
      console.error("DeepSeek classification error:", error);
      throw error;
    }
  }

  /**
   * Route to Backend Agent for quiz generation
   */
  private async routeToBackendAgent(query: string, context: any): Promise<any> {
    // Temporarily skip backend agent due to complexity issues
    // Go directly to DeepSeek API for quiz generation
    console.log(
      "🔄 Using DeepSeek API for quiz generation (backend agent temporarily disabled)..."
    );
    return await this.routeToDeepSeekAPIForQuiz(query, context);
  }

  /**
   * Route to Manual Generator
   */
  private async routeToManualGenerator(
    query: string,
    context: any
  ): Promise<any> {
    try {
      // Add routing message to chat
      this.addChatMessage({
        type: "orchestrator",
        content: `Routing manual request to Manual Creator Agent...`,
        metadata: { status: "routing" },
      });

      // Use DeepSeek API directly for manual generation (manual-creator-agent integration pending)
      console.log("Using DeepSeek API for manual generation...");
      const manual = await this.generateManualWithDeepSeek(query, "");

      // Add completion message
      this.addChatMessage({
        type: "orchestrator",
        content: `Manual generation completed successfully!`,
        metadata: { status: "completed" },
      });

      return {
        type: "manual",
        result: {
          data: manual,
        },
        agentId: "manual-generator-agent",
        chatHistory: this.getChatHistory(),
      };
    } catch (error) {
      console.error("Manual generator routing failed:", error);

      // Fallback to general chat
      console.log("🔄 Falling back to general chat...");
      return await this.routeToDeepSeekAPI(query, context);
    }
  }

  /**
   * Route to DeepSeek API for quiz generation (fallback)
   */
  private async routeToDeepSeekAPIForQuiz(
    query: string,
    context: any
  ): Promise<any> {
    try {
      // Add fallback message to chat
      this.addChatMessage({
        type: "orchestrator",
        content: `Backend agent unavailable, using DeepSeek API for quiz generation...`,
        metadata: { status: "fallback" },
      });

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;

      const client = new OpenAI({
        apiKey: "sk-6796ea0f38c7499dbf47c7ff2a026966",
        baseURL: "https://api.deepseek.com",
      });

      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an expert quiz creator specializing in educational content. Create a comprehensive quiz based on the user's request.

Generate exactly 20 multiple-choice questions with 4 options each (A, B, C, D). Format your response as JSON:

{
  "quiz_questions": [
    {
      "question": "Question text here",
      "correct_answer": "A",
      "answers": [
        {"answer": "Option A"},
        {"answer": "Option B"},
        {"answer": "Option C"},
        {"answer": "Option D"}
      ],
      "difficulty": "medium"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Create diverse, educational questions about the specific topic requested
- Do NOT repeat the same question or similar questions
- Each question should test different aspects of the topic
- Questions should be factually accurate and educational
- Vary the difficulty levels (easy, medium, hard)
- Make sure correct answers are distributed randomly across A, B, C, D positions
- Questions should be clear, concise, and well-written
- Focus on important concepts, not trivial details
- IMPORTANT: Return ONLY valid JSON, no additional text or explanations`,
          },
          {
            role: "user",
            content: `Create a quiz about: ${query}`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || "{}";
      console.log("DeepSeek API response:", response);

      try {
        // Try to extract JSON from the response if it contains extra text
        let jsonString = response.trim();

        // Look for JSON object boundaries
        const jsonStart = jsonString.indexOf("{");
        const jsonEnd = jsonString.lastIndexOf("}");

        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }

        const quizData = JSON.parse(jsonString);

        // Add completion message
        this.addChatMessage({
          type: "orchestrator",
          content: `Quiz generated successfully using DeepSeek API!`,
          metadata: { status: "completed" },
        });

        return {
          type: "quiz",
          result: {
            data: quizData,
          },
          agentId: "deepseek-quiz-agent",
          chatHistory: this.getChatHistory(),
        };
      } catch (parseError) {
        // If JSON parsing fails, try to generate a better fallback quiz
        console.log(
          "JSON parsing failed, attempting to generate fallback quiz..."
        );

        const topic =
          query
            .toLowerCase()
            .replace(
              /create a quiz about|quiz about|generate.*quiz.*about|make.*quiz.*about/gi,
              ""
            )
            .trim() || "general knowledge";

        // Try to generate a better quiz using a simpler prompt
        try {
          const fallbackCompletion = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: `Create 20 educational multiple-choice questions about "${topic}". Each question should have 4 options (A, B, C, D). Return ONLY valid JSON in this exact format:

{
  "quiz_questions": [
    {
      "question": "What is...?",
      "correct_answer": "A",
      "answers": [
        {"answer": "Option A"},
        {"answer": "Option B"},
        {"answer": "Option C"},
        {"answer": "Option D"}
      ],
      "difficulty": "medium"
    }
  ]
}

Make questions educational and factually accurate about ${topic}.`,
              },
              {
                role: "user",
                content: `Create a quiz about ${topic}`,
              },
            ],
            max_tokens: 3000,
            temperature: 0.5,
            stream: false,
          });

          const fallbackResponse =
            fallbackCompletion.choices[0]?.message?.content || "{}";
          console.log("Fallback API response:", fallbackResponse);

          // Try to parse the fallback response
          let fallbackJsonString = fallbackResponse.trim();
          const fallbackJsonStart = fallbackJsonString.indexOf("{");
          const fallbackJsonEnd = fallbackJsonString.lastIndexOf("}");

          if (
            fallbackJsonStart !== -1 &&
            fallbackJsonEnd !== -1 &&
            fallbackJsonEnd > fallbackJsonStart
          ) {
            fallbackJsonString = fallbackJsonString.substring(
              fallbackJsonStart,
              fallbackJsonEnd + 1
            );
          }

          const fallbackQuiz = JSON.parse(fallbackJsonString);

          return {
            type: "quiz",
            result: {
              data: fallbackQuiz,
            },
            agentId: "deepseek-fallback-agent",
            chatHistory: this.getChatHistory(),
          };
        } catch (fallbackError) {
          console.error("Fallback quiz generation also failed:", fallbackError);
        }

        // Ultimate fallback - return error message
        this.addChatMessage({
          type: "orchestrator",
          content: `Failed to generate quiz for "${topic}". Please try again with a different topic.`,
          metadata: { status: "error" },
        });

        return {
          type: "error",
          response: `I apologize, but I couldn't generate a quiz about "${topic}". Please try again with a different topic or rephrase your request.`,
          agentId: "error-agent",
          chatHistory: this.getChatHistory(),
        };
      }
    } catch (error) {
      console.error("DeepSeek API quiz generation failed:", error);
      throw error;
    }
  }

  /**
   * Route to DeepSeek API for general chat
   */
  private async routeToDeepSeekAPI(query: string, context: any): Promise<any> {
    try {
      // Add routing message to chat
      this.addChatMessage({
        type: "orchestrator",
        content: `Routing chat request to DeepSeek API...`,
        metadata: { status: "routing" },
      });

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;

      const client = new OpenAI({
        apiKey: "sk-6796ea0f38c7499dbf47c7ff2a026966",
        baseURL: "https://api.deepseek.com",
      });

      // Get recent chat history for context
      const recentHistory = this.chatHistory
        .filter((msg) => msg.type !== "system")
        .slice(-10)
        .map((msg) => ({
          role:
            msg.type === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        }));

      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant integrated into a quiz application. You can:

1. **Answer general questions** - Provide helpful, accurate, and friendly responses
2. **Help with quiz creation** - When users ask to create quizzes, guide them on how to do so
3. **Provide educational support** - Help with learning and understanding various topics

Guidelines:
- Be conversational and friendly
- Keep responses concise but informative
- If someone asks to create a quiz, explain that they should use phrases like "create a quiz about [topic]" or "generate a quiz on [subject]"
- Always be helpful and encouraging
- If you don't know something, say so honestly

Current context: You're helping a user who is using a quiz application.`,
          },
          ...recentHistory,
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      });

      const response =
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response.";

      // Add response to chat history
      this.addChatMessage({
        type: "agent",
        content: response,
        metadata: { agentId: "deepseek-chat-agent", status: "completed" },
      });

      return {
        type: "chat",
        response,
        agentId: "deepseek-chat-agent",
        chatHistory: this.getChatHistory(),
      };
    } catch (error) {
      console.error("DeepSeek API routing failed:", error);
      throw error;
    }
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

    for (const agentCardUrl of this.knownAgentUrls) {
      try {
        console.log(`🔍 Discovering agent at ${agentCardUrl}...`);
        const agentCard = await this.getAgentCard(agentCardUrl);

        // Extract base URL from agent card URL
        const baseUrl = agentCardUrl.replace(
          "/.well-known/agent-card.json",
          ""
        );

        const agentInfo: AgentInfo = {
          name: agentCard.name || `Agent-${baseUrl.split(":").pop()}`,
          url: baseUrl,
          skills: agentCard.skills?.map((s: any) => s.id) || [],
          status: "online",
          lastSeen: new Date(),
          capabilities: agentCard.capabilities,
        };

        this.agents.set(baseUrl, agentInfo);
        discoveredAgents.push(agentInfo);

        console.log(
          `✅ Successfully discovered agent: ${agentInfo.name} at ${baseUrl}`
        );

        // Add discovery message to chat
        this.addChatMessage({
          type: "system",
          content: `Discovered agent: ${agentInfo.name} at ${baseUrl} with ${agentInfo.skills.length} skills`,
          metadata: {
            agentId: baseUrl,
            skillId: agentInfo.skills.join(","),
            status: "discovered",
          },
        });
      } catch (error) {
        console.error(`❌ Failed to discover agent at ${agentCardUrl}:`, error);

        // Extract base URL from agent card URL
        const baseUrl = agentCardUrl.replace(
          "/.well-known/agent-card.json",
          ""
        );

        const agentInfo: AgentInfo = {
          name: `Unknown Agent (${baseUrl})`,
          url: baseUrl,
          skills: [],
          status: "offline",
          lastSeen: new Date(),
        };
        this.agents.set(baseUrl, agentInfo);
        discoveredAgents.push(agentInfo);

        // Add failure message to chat
        this.addChatMessage({
          type: "system",
          content: `Failed to discover agent at ${baseUrl}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          metadata: { agentId: baseUrl, status: "offline" },
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
      question_count = 20, // Default number of questions to generate
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
   * Orchestrate manual generation workflow
   */
  async orchestrateManualWorkflow(requestData: any): Promise<any> {
    // Generate unique workflow ID using timestamp for uniqueness
    const workflowId = `manual_workflow_${Date.now()}`;

    // Extract and set default values for manual parameters
    const {
      topic, // Required: The subject matter for the manual
      prompt = "", // Optional: Additional prompt or requirements
    } = requestData;

    try {
      // Notify chat system that workflow is starting
      this.addChatMessage({
        type: "orchestrator",
        content: `Starting manual workflow for topic: "${topic}"`,
        metadata: { workflowId, status: "starting" },
      });

      // Use DeepSeek API directly for manual generation
      const manual = await this.generateManualWithDeepSeek(topic, prompt);

      // Notify chat system of successful completion
      this.addChatMessage({
        type: "orchestrator",
        content: `Manual workflow completed successfully! Generated comprehensive manual for "${topic}".`,
        metadata: { workflowId, status: "completed" },
      });

      // Return structured response with workflow details
      return {
        workflow_id: workflowId,
        status: "completed",
        result: {
          data: manual,
        },
        timestamp: new Date().toISOString(), // ISO timestamp for tracking
      };
    } catch (error) {
      // Log error for debugging purposes
      console.error("Manual workflow orchestration failed:", error);

      // Notify chat system of workflow failure
      this.addChatMessage({
        type: "orchestrator",
        content: `Manual workflow failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        metadata: { workflowId, status: "failed" },
      });

      // Re-throw error to be handled by calling code
      throw error;
    }
  }

  /**
   * Call the actual manual-creator-agent using A2A protocol
   */
  private async callManualCreatorAgent(
    topic: string,
    prompt: string
  ): Promise<any> {
    try {
      console.log(`📚 Calling manual-creator-agent for topic: ${topic}`);

      // Call the manual-creator-agent directly
      const response = await fetch(
        "http://localhost:4002/api/actions/generate-manual",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            prompt: prompt,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Manual creator agent responded with status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Manual creator agent response:", result);

      // Extract the manual data from the response
      if (result.data && result.data.content) {
        // The response contains markdown content, parse it
        const markdownContent = result.data.content;

        // Extract title from markdown
        const titleMatch = markdownContent.match(/^# (.+)$/m);
        const title = titleMatch ? titleMatch[1] : `Manual: ${topic}`;

        // Extract introduction
        const introMatch = markdownContent.match(
          /## Introduction\n([\s\S]*?)(?=\n## |\n### |$)/
        );
        const introduction = introMatch
          ? introMatch[1].trim()
          : `This manual provides comprehensive information about ${topic}`;

        // Extract sections
        const sections = [];
        const sectionRegex =
          /### Section \d+: ([^\n]+)\n([\s\S]*?)(?=\n### Section |\n## |$)/g;
        let sectionMatch;

        while ((sectionMatch = sectionRegex.exec(markdownContent)) !== null) {
          const sectionTitle = sectionMatch[1].trim();
          const sectionContent = sectionMatch[2].trim();

          // Extract subsections if any
          const subsections = [];
          const subsectionRegex = /\*\*([^*]+):\*\*([^*]+)/g;
          let subsectionMatch;

          while (
            (subsectionMatch = subsectionRegex.exec(sectionContent)) !== null
          ) {
            subsections.push({
              title: subsectionMatch[1].trim(),
              content: subsectionMatch[2].trim(),
            });
          }

          sections.push({
            title: sectionTitle,
            content: sectionContent,
            subsections: subsections,
          });
        }

        // Extract conclusion
        const conclusionMatch = markdownContent.match(
          /## Collaborative Review\n([\s\S]*?)(?=\n---|\*|$)/
        );
        const conclusion = conclusionMatch
          ? conclusionMatch[1].trim()
          : `This manual has provided comprehensive coverage of ${topic}.`;

        // Extract glossary and references
        const glossaryMatch = markdownContent.match(
          /\*\*Glossary:\*\*\n([\s\S]*?)(?=\n\*\*References:\*\*|$)/
        );
        const referencesMatch = markdownContent.match(
          /\*\*References:\*\*\n([\s\S]*?)(?=\n---|\*|$)/
        );

        return {
          title: title,
          introduction: {
            purpose: introduction,
            audience: "General users",
            prerequisites: "Basic understanding of the topic",
          },
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    title: "Overview",
                    content: `This section provides an overview of ${topic}.`,
                    subsections: [],
                  },
                  {
                    title: "Getting Started",
                    content: `This section covers the basics of ${topic}.`,
                    subsections: [],
                  },
                  {
                    title: "Advanced Topics",
                    content: `This section covers advanced concepts related to ${topic}.`,
                    subsections: [],
                  },
                ],
          conclusion: conclusion,
          appendix: {
            glossary: glossaryMatch
              ? glossaryMatch[1].trim()
              : "Key terms and definitions",
            resources: referencesMatch
              ? referencesMatch[1].trim()
              : "Additional resources and references",
          },
        };
      } else {
        throw new Error("Invalid response format from manual creator agent");
      }
    } catch (error) {
      console.error("Error calling manual creator agent:", error);
      throw error;
    }
  }

  /**
   * Generate manual using DeepSeek API
   */
  private async generateManualWithDeepSeek(
    topic: string,
    prompt: string
  ): Promise<any> {
    try {
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;

      const client = new OpenAI({
        apiKey: "sk-6796ea0f38c7499dbf47c7ff2a026966",
        baseURL: "https://api.deepseek.com",
      });

      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an expert technical writer specializing in creating comprehensive manuals and documentation. Create a detailed manual based on the user's request.

Generate a comprehensive manual in JSON format:

{
  "title": "Manual Title",
  "introduction": {
    "purpose": "Purpose of the manual",
    "audience": "Target audience",
    "prerequisites": "Required knowledge or skills"
  },
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed content for this section",
      "subsections": [
        {
          "title": "Subsection Title",
          "content": "Subsection content"
        }
      ]
    }
  ],
  "conclusion": "Summary and next steps",
  "appendix": {
    "glossary": "Key terms and definitions",
    "resources": "Additional resources and references"
  }
}

REQUIREMENTS:
- Create a comprehensive, well-structured manual
- Include practical examples and step-by-step instructions
- Make content educational and easy to follow
- Organize information logically with clear sections
- Include relevant details and context
- Ensure content is accurate and professional`,
          },
          {
            role: "user",
            content: `Create a comprehensive manual about: ${topic}${
              prompt ? `\n\nAdditional requirements: ${prompt}` : ""
            }`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || "{}";

      try {
        // First try to parse as JSON directly
        const manualData = JSON.parse(response);
        return manualData;
      } catch (parseError) {
        console.log(
          "JSON parsing failed, trying to extract JSON from markdown:",
          parseError
        );

        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const extractedJson = jsonMatch[1].trim();
            const manualData = JSON.parse(extractedJson);
            return manualData;
          } catch (extractError) {
            console.log("Failed to parse extracted JSON:", extractError);
          }
        }

        // Try to extract JSON without code block markers
        const jsonStart = response.indexOf("{");
        const jsonEnd = response.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          try {
            const jsonString = response.substring(jsonStart, jsonEnd + 1);
            const manualData = JSON.parse(jsonString);
            return manualData;
          } catch (extractError) {
            console.log("Failed to parse extracted JSON string:", extractError);
          }
        }

        console.log(
          "All JSON extraction attempts failed, processing as markdown content"
        );

        // If JSON parsing fails, process the markdown content
        const markdownContent = response;

        // Extract title from markdown
        const titleMatch = markdownContent.match(/^# (.+)$/m);
        const title = titleMatch ? titleMatch[1] : `Manual: ${topic}`;

        // Extract introduction
        const introMatch = markdownContent.match(
          /## Introduction\n([\s\S]*?)(?=\n## |\n### |$)/
        );
        const introduction = introMatch
          ? introMatch[1].trim()
          : `This manual provides comprehensive information about ${topic}`;

        // Extract sections
        const sections = [];
        const sectionRegex =
          /### Section \d+: ([^\n]+)\n([\s\S]*?)(?=\n### Section |\n## |$)/g;
        let sectionMatch;

        while ((sectionMatch = sectionRegex.exec(markdownContent)) !== null) {
          const sectionTitle = sectionMatch[1].trim();
          const sectionContent = sectionMatch[2].trim();

          // Extract subsections if any
          const subsections = [];
          const subsectionRegex = /\*\*([^*]+):\*\*([^*]+)/g;
          let subsectionMatch;

          while (
            (subsectionMatch = subsectionRegex.exec(sectionContent)) !== null
          ) {
            subsections.push({
              title: subsectionMatch[1].trim(),
              content: subsectionMatch[2].trim(),
            });
          }

          sections.push({
            title: sectionTitle,
            content: sectionContent,
            subsections: subsections,
          });
        }

        // Extract conclusion
        const conclusionMatch = markdownContent.match(
          /## Collaborative Review\n([\s\S]*?)(?=\n---|\*|$)/
        );
        const conclusion = conclusionMatch
          ? conclusionMatch[1].trim()
          : `This manual has provided comprehensive coverage of ${topic}.`;

        // Extract glossary and references
        const glossaryMatch = markdownContent.match(
          /\*\*Glossary:\*\*\n([\s\S]*?)(?=\n\*\*References:\*\*|$)/
        );
        const referencesMatch = markdownContent.match(
          /\*\*References:\*\*\n([\s\S]*?)(?=\n---|\*|$)/
        );

        return {
          title: title,
          introduction: {
            purpose: introduction,
            audience: "General users",
            prerequisites: "Basic understanding of the topic",
          },
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    title: "Overview",
                    content: `This section provides an overview of ${topic}.`,
                    subsections: [],
                  },
                  {
                    title: "Getting Started",
                    content: `This section covers the basics of ${topic}.`,
                    subsections: [],
                  },
                  {
                    title: "Advanced Topics",
                    content: `This section covers advanced concepts related to ${topic}.`,
                    subsections: [],
                  },
                ],
          conclusion: conclusion,
          appendix: {
            glossary: glossaryMatch
              ? glossaryMatch[1].trim()
              : "Key terms and definitions",
            resources: referencesMatch
              ? referencesMatch[1].trim()
              : "Additional resources and references",
          },
        };
      }
    } catch (error) {
      console.error("DeepSeek manual generation error:", error);
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

      // Use direct HTTP call instead of A2A SDK to avoid agent card fetching issues
      const message = {
        messageId: uuidv4(),
        parts: [
          {
            kind: "text",
            text:
              step.input.topic ||
              JSON.stringify({
                skillId: step.skillId,
                input: step.input,
              }),
          },
        ],
      };

      // Send direct HTTP request to backend agent
      const response = await fetch(`${step.agentId}/a2a/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          configuration: {
            blocking: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log(`A2A response for step ${step.id}:`, result);

      // Handle the response - the backend agent returns the quiz data directly
      if (result && typeof result === "object") {
        // Extract quiz data from the response
        let quizData = null;

        if (result.task && result.task.artifacts) {
          // If response has task with artifacts, extract quiz from artifacts
          const quizArtifact = result.task.artifacts.find(
            (artifact: any) =>
              artifact.name === "quiz.json" || artifact.name === "quiz"
          );
          if (quizArtifact && quizArtifact.parts) {
            const quizText = quizArtifact.parts.find(
              (part: any) => part.kind === "text"
            )?.text;
            if (quizText) {
              quizData = JSON.parse(quizText);
            }
          }
        } else if (result.data) {
          // If response has data directly
          quizData = result.data;
        } else if (result.quiz_questions) {
          // If response has quiz_questions directly
          quizData = result;
        }

        if (quizData && quizData.quiz_questions) {
          console.log(
            `✅ Step ${step.id} completed successfully with ${quizData.quiz_questions.length} questions`
          );
          return quizData.quiz_questions;
        } else {
          console.log(
            `⚠️ Step ${step.id} completed but no quiz data found in response`
          );
          return [];
        }
      } else {
        console.log(
          `⚠️ Step ${step.id} completed with unexpected response format`
        );
        return [];
      }
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
