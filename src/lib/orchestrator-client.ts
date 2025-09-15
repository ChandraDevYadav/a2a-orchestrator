/**
 * Orchestrator Client for communicating with standalone orchestrator service
 */

export interface OrchestratorConfig {
  orchestratorUrl: string;
  timeoutMs?: number;
  retryAttempts?: number;
}

export class OrchestratorClient {
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = {
      timeoutMs: 30000,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Make HTTP request to orchestrator service
   */
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    data?: any
  ): Promise<T> {
    const url = `${this.config.orchestratorUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data && method === "POST") {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `Orchestrator request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Discover available agents
   */
  async discoverAgents(data?: any) {
    return this.makeRequest("/api/discover-agents", "POST", data);
  }

  /**
   * Orchestrate quiz workflow
   */
  async orchestrateQuizWorkflow(data: any) {
    return this.makeRequest("/api/orchestrate-quiz-workflow", "POST", data);
  }

  /**
   * Monitor system health
   */
  async monitorSystemHealth(data?: any) {
    return this.makeRequest("/api/monitor-system-health", "POST", data);
  }

  /**
   * Get chat history
   */
  async getChatHistory() {
    return this.makeRequest("/api/chat-history");
  }

  /**
   * Get all workflows
   */
  async getAllWorkflows() {
    return this.makeRequest("/api/workflows");
  }

  /**
   * Get all agents
   */
  async getAllAgents() {
    return this.makeRequest("/api/agents");
  }

  /**
   * Execute agent with resilience
   */
  async executeAgentWithResilience(query: string, context?: any) {
    return this.makeRequest("/api/execute-agent", "POST", { query, context });
  }

  /**
   * Check orchestrator health
   */
  async checkHealth() {
    return this.makeRequest("/health");
  }
}

// Default orchestrator client instance
export const orchestratorClient = new OrchestratorClient({
  orchestratorUrl:
    process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:5000",
});
