/**
 * Dynamic Agent Discovery and Service Registry
 * Handles multiple agents dynamically without hardcoded URLs
 */

export interface AgentDiscoveryConfig {
  discoveryMethod:
    | "environment"
    | "consul"
    | "etcd"
    | "kubernetes"
    | "multicast"
    | "manual";
  environment?: {
    prefix: string; // e.g., "QUIZ_AGENT"
    ports?: number[]; // e.g., [3000, 4001, 4002]
    hosts?: string[]; // e.g., ["localhost", "agent1.example.com"]
  };
  consul?: {
    host: string;
    port: number;
    serviceName: string;
  };
  kubernetes?: {
    namespace: string;
    labelSelector: string;
  };
  multicast?: {
    port: number;
    group: string;
  };
  manual?: {
    agents: Array<{
      id: string;
      url: string;
      capabilities: string[];
      metadata?: any;
    }>;
  };
}

export interface DiscoveredAgent {
  id: string;
  name: string;
  url: string;
  capabilities: string[];
  status: "online" | "offline" | "unknown";
  lastSeen: Date;
  metadata?: {
    version?: string;
    region?: string;
    instance?: string;
    load?: number;
    tags?: string[];
    namespace?: string;
  };
}

export class DynamicAgentDiscovery {
  private discoveredAgents: Map<string, DiscoveredAgent> = new Map();
  private discoveryInterval: NodeJS.Timeout | null = null;
  private config: AgentDiscoveryConfig;

  constructor(config: AgentDiscoveryConfig) {
    this.config = config;
    this.startDiscovery();
  }

  /**
   * Start agent discovery based on configuration
   */
  private startDiscovery(): void {
    // Initial discovery
    this.performDiscovery();

    // Periodic discovery every 30 seconds
    this.discoveryInterval = setInterval(() => {
      this.performDiscovery();
    }, 30000);
  }

  /**
   * Perform discovery based on configured method
   */
  private async performDiscovery(): Promise<void> {
    try {
      switch (this.config.discoveryMethod) {
        case "environment":
          await this.discoverFromEnvironment();
          break;
        case "consul":
          await this.discoverFromConsul();
          break;
        case "kubernetes":
          await this.discoverFromKubernetes();
          break;
        case "multicast":
          await this.discoverFromMulticast();
          break;
        case "manual":
          await this.discoverFromManual();
          break;
        default:
          console.warn(
            `Unknown discovery method: ${this.config.discoveryMethod}`
          );
      }
    } catch (error) {
      console.error("Agent discovery failed:", error);
    }
  }

  /**
   * Discover agents from environment variables
   */
  private async discoverFromEnvironment(): Promise<void> {
    if (!this.config.environment) return;

    const {
      prefix,
      ports = [3000, 4001],
      hosts = ["localhost"],
    } = this.config.environment;

    for (const host of hosts) {
      for (const port of ports) {
        const url = `http://${host}:${port}`;
        const agentId = `${host}:${port}`;

        try {
          // Check if agent exists and get its capabilities
          const agentInfo = await this.probeAgent(url);
          if (agentInfo) {
            this.discoveredAgents.set(agentId, {
              id: agentId,
              name: agentInfo.name || `Agent-${agentId}`,
              url,
              capabilities: agentInfo.capabilities || [],
              status: "online",
              lastSeen: new Date(),
              metadata: {
                version: agentInfo.version,
                instance: agentId,
                tags: [`env:${prefix}`],
              },
            });
          }
        } catch (error) {
          // Mark as offline if probe fails
          const existing = this.discoveredAgents.get(agentId);
          if (existing) {
            existing.status = "offline";
            existing.lastSeen = new Date();
          }
        }
      }
    }
  }

  /**
   * Discover agents from Consul service registry
   */
  private async discoverFromConsul(): Promise<void> {
    if (!this.config.consul) return;

    const { host, port, serviceName } = this.config.consul;
    const consulUrl = `http://${host}:${port}`;

    try {
      const response = await fetch(
        `${consulUrl}/v1/health/service/${serviceName}`
      );
      const services = await response.json();

      for (const service of services) {
        const agent = service.Service;
        const agentId = agent.ID;

        this.discoveredAgents.set(agentId, {
          id: agentId,
          name: agent.Service,
          url: `http://${agent.Address}:${agent.Port}`,
          capabilities: agent.Tags || [],
          status: "online",
          lastSeen: new Date(),
          metadata: {
            version: agent.Meta?.version,
            region: service.Node?.Datacenter,
            instance: agentId,
            tags: agent.Tags,
          },
        });
      }
    } catch (error) {
      console.error("Consul discovery failed:", error);
    }
  }

  /**
   * Discover agents from Kubernetes
   */
  private async discoverFromKubernetes(): Promise<void> {
    if (!this.config.kubernetes) return;

    const { namespace, labelSelector } = this.config.kubernetes;

    try {
      // This would use Kubernetes API to discover services
      // Implementation depends on your K8s setup
      const response = await fetch(
        `/api/v1/namespaces/${namespace}/services?labelSelector=${labelSelector}`
      );
      const services = await response.json();

      for (const service of services.items) {
        const agentId = service.metadata.name;
        const url = `http://${service.spec.clusterIP}:${service.spec.ports[0].port}`;

        this.discoveredAgents.set(agentId, {
          id: agentId,
          name: service.metadata.name,
          url,
          capabilities: service.metadata.labels?.capabilities?.split(",") || [],
          status: "online",
          lastSeen: new Date(),
          metadata: {
            version: service.metadata.labels?.version,
            namespace: service.metadata.namespace,
            instance: agentId,
            tags: Object.keys(service.metadata.labels || {}),
          },
        });
      }
    } catch (error) {
      console.error("Kubernetes discovery failed:", error);
    }
  }

  /**
   * Discover agents using multicast
   */
  private async discoverFromMulticast(): Promise<void> {
    if (!this.config.multicast) return;

    // Implementation would use UDP multicast to discover agents
    // This is a simplified version
    console.log("Multicast discovery not implemented yet");
  }

  /**
   * Use manually configured agents
   */
  private async discoverFromManual(): Promise<void> {
    if (!this.config.manual) return;

    for (const agentConfig of this.config.manual.agents) {
      try {
        const agentInfo = await this.probeAgent(agentConfig.url);
        if (agentInfo) {
          this.discoveredAgents.set(agentConfig.id, {
            id: agentConfig.id,
            name: agentInfo.name || agentConfig.id,
            url: agentConfig.url,
            capabilities: agentConfig.capabilities,
            status: "online",
            lastSeen: new Date(),
            metadata: agentConfig.metadata,
          });
        }
      } catch (error) {
        console.warn(`Failed to probe manual agent ${agentConfig.id}:`, error);
      }
    }
  }

  /**
   * Probe an agent to get its information
   */
  private async probeAgent(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${url}/.well-known/agent-card.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

    return null;
  }

  /**
   * Get all discovered agents
   */
  getAllAgents(): DiscoveredAgent[] {
    return Array.from(this.discoveredAgents.values());
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string): DiscoveredAgent[] {
    return this.getAllAgents().filter((agent) =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Get online agents only
   */
  getOnlineAgents(): DiscoveredAgent[] {
    return this.getAllAgents().filter((agent) => agent.status === "online");
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): DiscoveredAgent | undefined {
    return this.discoveredAgents.get(agentId);
  }

  /**
   * Stop discovery
   */
  stop(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: "online" | "offline"): void {
    const agent = this.discoveredAgents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastSeen = new Date();
    }
  }
}
