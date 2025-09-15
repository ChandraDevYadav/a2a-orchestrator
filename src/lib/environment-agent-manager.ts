/**
 * Environment-based Agent Configuration
 * Handles different environments (dev, staging, prod) dynamically
 */

export interface EnvironmentConfig {
  name: string;
  agents: {
    frontend: {
      url: string;
      instances?: string[];
    };
    backend: {
      url: string;
      instances?: string[];
    };
    services?: Array<{
      name: string;
      url: string;
      capabilities: string[];
      instances?: string[];
    }>;
  };
}

export class EnvironmentAgentManager {
  private config: EnvironmentConfig;
  private discoveredAgents: Map<string, any> = new Map();

  constructor(environment: string = "development") {
    this.config = this.loadEnvironmentConfig(environment);
    this.discoverAgents();
  }

  /**
   * Load configuration based on environment
   */
  private loadEnvironmentConfig(environment: string): EnvironmentConfig {
    const configs: Record<string, EnvironmentConfig> = {
      development: {
        name: "development",
        agents: {
          frontend: {
            url: "http://localhost:3000",
            instances: ["http://localhost:3000", "http://localhost:3001"],
          },
          backend: {
            url: "http://localhost:4001",
            instances: ["http://localhost:4001", "http://localhost:4002"],
          },
          services: [
            {
              name: "quiz-generator",
              url: "http://localhost:4001",
              capabilities: ["quiz-generation", "content-analysis"],
            },
            {
              name: "quiz-display",
              url: "http://localhost:3000",
              capabilities: ["ui-orchestration", "quiz-display"],
            },
          ],
        },
      },
      staging: {
        name: "staging",
        agents: {
          frontend: {
            url: "https://quiz-frontend-staging.example.com",
            instances: [
              "https://quiz-frontend-staging.example.com",
              "https://quiz-frontend-staging-2.example.com",
            ],
          },
          backend: {
            url: "https://quiz-backend-staging.example.com",
            instances: [
              "https://quiz-backend-staging.example.com",
              "https://quiz-backend-staging-2.example.com",
            ],
          },
          services: [
            {
              name: "quiz-generator",
              url: "https://quiz-backend-staging.example.com",
              capabilities: ["quiz-generation", "content-analysis"],
            },
            {
              name: "quiz-display",
              url: "https://quiz-frontend-staging.example.com",
              capabilities: ["ui-orchestration", "quiz-display"],
            },
          ],
        },
      },
      production: {
        name: "production",
        agents: {
          frontend: {
            url: "https://quiz-frontend.example.com",
            instances: [
              "https://quiz-frontend.example.com",
              "https://quiz-frontend-2.example.com",
              "https://quiz-frontend-3.example.com",
            ],
          },
          backend: {
            url: "https://quiz-backend.example.com",
            instances: [
              "https://quiz-backend.example.com",
              "https://quiz-backend-2.example.com",
              "https://quiz-backend-3.example.com",
            ],
          },
          services: [
            {
              name: "quiz-generator",
              url: "https://quiz-backend.example.com",
              capabilities: ["quiz-generation", "content-analysis"],
            },
            {
              name: "quiz-display",
              url: "https://quiz-frontend.example.com",
              capabilities: ["ui-orchestration", "quiz-display"],
            },
          ],
        },
      },
    };

    return configs[environment] || configs.development;
  }

  /**
   * Discover agents from environment configuration
   */
  private async discoverAgents(): Promise<void> {
    const { agents } = this.config;

    // Add frontend agents
    if (agents.frontend.instances) {
      for (const url of agents.frontend.instances) {
        await this.addAgent({
          id: `frontend-${url}`,
          name: "Frontend Agent",
          url,
          capabilities: ["ui-orchestration", "quiz-display"],
          type: "frontend",
        });
      }
    }

    // Add backend agents
    if (agents.backend.instances) {
      for (const url of agents.backend.instances) {
        await this.addAgent({
          id: `backend-${url}`,
          name: "Backend Agent",
          url,
          capabilities: ["quiz-generation", "content-analysis"],
          type: "backend",
        });
      }
    }

    // Add additional services
    if (agents.services) {
      for (const service of agents.services) {
        if (service.instances) {
          for (const url of service.instances) {
            await this.addAgent({
              id: `${service.name}-${url}`,
              name: service.name,
              url,
              capabilities: service.capabilities,
              type: "service",
            });
          }
        } else {
          await this.addAgent({
            id: service.name,
            name: service.name,
            url: service.url,
            capabilities: service.capabilities,
            type: "service",
          });
        }
      }
    }
  }

  /**
   * Add agent to registry
   */
  private async addAgent(agentInfo: any): Promise<void> {
    try {
      // Probe agent to verify it's online
      const isOnline = await this.probeAgent(agentInfo.url);

      this.discoveredAgents.set(agentInfo.id, {
        ...agentInfo,
        status: isOnline ? "online" : "offline",
        lastSeen: new Date(),
      });
    } catch (error) {
      console.warn(`Failed to probe agent ${agentInfo.id}:`, error);
      this.discoveredAgents.set(agentInfo.id, {
        ...agentInfo,
        status: "offline",
        lastSeen: new Date(),
      });
    }
  }

  /**
   * Probe agent to check if it's online
   */
  private async probeAgent(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${url}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all agents
   */
  getAllAgents(): any[] {
    return Array.from(this.discoveredAgents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): any[] {
    return this.getAllAgents().filter((agent) => agent.type === type);
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string): any[] {
    return this.getAllAgents().filter((agent) =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Get load-balanced agent URL
   */
  getLoadBalancedAgent(capability: string): string | null {
    const agents = this.getAgentsByCapability(capability).filter(
      (agent) => agent.status === "online"
    );

    if (agents.length === 0) return null;

    // Simple round-robin load balancing
    const index = Math.floor(Math.random() * agents.length);
    return agents[index].url;
  }

  /**
   * Get primary agent URL (first available)
   */
  getPrimaryAgent(capability: string): string | null {
    const agent = this.getAgentsByCapability(capability).find(
      (agent) => agent.status === "online"
    );

    return agent ? agent.url : null;
  }

  /**
   * Get environment name
   */
  getEnvironmentName(): string {
    return this.config.name;
  }
}
