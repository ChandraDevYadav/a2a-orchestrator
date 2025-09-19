/**
 * Local Orchestrator Client for communicating with integrated orchestrator API routes
 * This client uses the Next.js API routes instead of a separate server
 */

export interface LocalOrchestratorConfig {
  timeoutMs?: number;
  retryAttempts?: number;
}

export class LocalOrchestratorClient {
  private config: LocalOrchestratorConfig;

  constructor(config: LocalOrchestratorConfig = {}) {
    this.config = {
      timeoutMs: 30000,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Make HTTP request to local orchestrator API routes
   */
  private async makeRequest<T>(
    action: string,
    method: "GET" | "POST" = "POST",
    data?: any
  ): Promise<T> {
    const url = "/api/orchestrator";

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method === "POST") {
      options.body = JSON.stringify({ action, ...data });
    } else {
      // For GET requests, add action as query parameter
      const urlWithParams = new URL(url, window.location.origin);
      urlWithParams.searchParams.set("action", action);

      const response = await fetch(urlWithParams.toString(), options);

      if (!response.ok) {
        throw new Error(
          `Orchestrator request failed: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
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
    return this.makeRequest("discover_agents", "POST", data);
  }

  /**
   * Orchestrate quiz workflow
   */
  async orchestrateQuizWorkflow(data: any) {
    return this.makeRequest("orchestrate_quiz_workflow", "POST", data);
  }

  /**
   * Orchestrate manual workflow
   */
  async orchestrateManualWorkflow(data: any) {
    return this.makeRequest("orchestrate-manual-workflow", "POST", data);
  }

  /**
   * Monitor system health
   */
  async monitorSystemHealth(data?: any) {
    return this.makeRequest("monitor_system_health", "POST", data);
  }

  /**
   * Get chat history
   */
  async getChatHistory() {
    return this.makeRequest("get_chat_history", "POST");
  }

  /**
   * Get workflow chat history
   */
  async getWorkflowChatHistory(workflowId: string) {
    return this.makeRequest("get_workflow_chat_history", "POST", {
      workflowId,
    });
  }

  /**
   * Clear chat history
   */
  async clearChatHistory() {
    return this.makeRequest("clear_chat_history", "POST");
  }

  /**
   * Get all workflows
   */
  async getAllWorkflows() {
    return this.makeRequest("get_workflows", "POST");
  }

  /**
   * Get specific workflow
   */
  async getWorkflow(workflowId: string) {
    return this.makeRequest("get_workflow", "POST", { workflowId });
  }

  /**
   * Get all agents
   */
  async getAllAgents() {
    return this.makeRequest("get_agents", "POST");
  }

  /**
   * Get specific agent
   */
  async getAgent(url: string) {
    return this.makeRequest("get_agent", "POST", { url });
  }

  /**
   * Determine agent for query
   */
  async determineAgentForQuery(query: string, context?: any) {
    return this.makeRequest("determine_agent_for_query", "POST", {
      query,
      context,
    });
  }

  /**
   * Execute agent with resilience
   */
  async executeAgentWithResilience(query: string, context?: any) {
    return this.makeRequest("execute_agent_with_resilience", "POST", {
      query,
      context,
    });
  }

  /**
   * Handle general MCP query
   */
  async handleGeneralMCPQuery(data: any) {
    return this.makeRequest("handle_general_mcp_query", "POST", data);
  }

  /**
   * Handle centralized request
   */
  async handleCentralizedRequest(data: any) {
    return this.makeRequest("handle_centralized_request", "POST", data);
  }

  /**
   * Check orchestrator health
   */
  async checkHealth() {
    return this.makeRequest("health", "GET");
  }

  /**
   * Get orchestrator status
   */
  async getStatus() {
    return this.makeRequest("status", "GET");
  }
}

// Default local orchestrator client instance
export const localOrchestratorClient = new LocalOrchestratorClient();
