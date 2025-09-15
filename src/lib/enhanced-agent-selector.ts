/**
 * Enhanced Agent Selection System
 * Provides sophisticated agent routing based on multiple criteria
 */

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  confidence: number; // 0-1 score for how well this agent handles this capability
  requirements?: string[]; // Additional requirements (e.g., "needs-auth", "high-memory")
}

export interface AgentProfile {
  id: string;
  name: string;
  url: string;
  capabilities: AgentCapability[];
  status: "online" | "offline" | "busy" | "maintenance";
  load: number; // Current load (0-1)
  responseTime: number; // Average response time in ms
  reliability: number; // Success rate (0-1)
  lastSeen: Date;
}

export interface QueryContext {
  query: string;
  userIntent?: string;
  previousContext?: any;
  userPreferences?: any;
  urgency?: "low" | "medium" | "high";
  complexity?: "simple" | "moderate" | "complex";
}

export class EnhancedAgentSelector {
  private agents: Map<string, AgentProfile> = new Map();
  private capabilityIndex: Map<string, AgentProfile[]> = new Map();

  /**
   * Register an agent with its capabilities
   */
  registerAgent(agent: AgentProfile): void {
    this.agents.set(agent.id, agent);

    // Build capability index for faster lookups
    agent.capabilities.forEach((capability) => {
      if (!this.capabilityIndex.has(capability.id)) {
        this.capabilityIndex.set(capability.id, []);
      }
      this.capabilityIndex.get(capability.id)!.push(agent);
    });
  }

  /**
   * Select the best agent for a given query using multiple criteria
   */
  selectAgent(
    query: string,
    context?: QueryContext
  ): {
    agent: AgentProfile | null;
    confidence: number;
    reasoning: string;
  } {
    const queryLower = query.toLowerCase();
    const candidates: Array<{
      agent: AgentProfile;
      score: number;
      reasoning: string;
    }> = [];

    // Score each agent based on multiple criteria
    for (const agent of Array.from(this.agents.values())) {
      if (agent.status !== "online") continue;

      const { score, reasoning } = this.scoreAgent(agent, queryLower, context);
      if (score > 0) {
        candidates.push({ agent, score, reasoning });
      }
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      return {
        agent: null,
        confidence: 0,
        reasoning: "No suitable agents found",
      };
    }

    const best = candidates[0];
    return {
      agent: best.agent,
      confidence: best.score,
      reasoning: best.reasoning,
    };
  }

  /**
   * Score an agent based on multiple criteria
   */
  private scoreAgent(
    agent: AgentProfile,
    queryLower: string,
    context?: QueryContext
  ): { score: number; reasoning: string } {
    let totalScore = 0;
    const reasons: string[] = [];

    // 1. Capability matching (40% weight)
    const capabilityScore = this.calculateCapabilityScore(agent, queryLower);
    totalScore += capabilityScore * 0.4;
    if (capabilityScore > 0) {
      reasons.push(`Capability match: ${capabilityScore.toFixed(2)}`);
    }

    // 2. Agent availability (20% weight)
    const availabilityScore = this.calculateAvailabilityScore(agent);
    totalScore += availabilityScore * 0.2;
    reasons.push(`Availability: ${availabilityScore.toFixed(2)}`);

    // 3. Performance metrics (20% weight)
    const performanceScore = this.calculatePerformanceScore(agent);
    totalScore += performanceScore * 0.2;
    reasons.push(`Performance: ${performanceScore.toFixed(2)}`);

    // 4. Context awareness (20% weight)
    const contextScore = this.calculateContextScore(agent, context);
    totalScore += contextScore * 0.2;
    if (contextScore > 0) {
      reasons.push(`Context match: ${contextScore.toFixed(2)}`);
    }

    return {
      score: Math.min(totalScore, 1), // Cap at 1.0
      reasoning: reasons.join(", "),
    };
  }

  private calculateCapabilityScore(
    agent: AgentProfile,
    queryLower: string
  ): number {
    let bestMatch = 0;

    for (const capability of agent.capabilities) {
      let capabilityScore = 0;

      // Check keyword matches
      const keywordMatches = capability.keywords.filter((keyword) =>
        queryLower.includes(keyword.toLowerCase())
      ).length;

      if (keywordMatches > 0) {
        capabilityScore =
          (keywordMatches / capability.keywords.length) * capability.confidence;
        bestMatch = Math.max(bestMatch, capabilityScore);
      }
    }

    return bestMatch;
  }

  private calculateAvailabilityScore(agent: AgentProfile): number {
    // Factor in status, load, and recent activity
    let score = 1.0;

    if (agent.status === "busy") score *= 0.7;
    if (agent.status === "maintenance") score *= 0.1;
    if (agent.load > 0.8) score *= 0.5;

    // Check if agent was recently active
    const timeSinceLastSeen = Date.now() - agent.lastSeen.getTime();
    if (timeSinceLastSeen > 300000) {
      // 5 minutes
      score *= 0.8;
    }

    return score;
  }

  private calculatePerformanceScore(agent: AgentProfile): number {
    // Combine response time and reliability
    const responseScore = Math.max(0, 1 - agent.responseTime / 5000); // 5s max
    const reliabilityScore = agent.reliability;

    return (responseScore + reliabilityScore) / 2;
  }

  private calculateContextScore(
    agent: AgentProfile,
    context?: QueryContext
  ): number {
    if (!context) return 0.5; // Neutral score if no context

    let score = 0.5; // Base score

    // Adjust based on urgency
    if (context.urgency === "high" && agent.responseTime < 1000) {
      score += 0.3;
    }

    // Adjust based on complexity
    if (context.complexity === "complex" && agent.capabilities.length > 3) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get fallback agents if primary selection fails
   */
  getFallbackAgents(query: string, excludeAgentId?: string): AgentProfile[] {
    const candidates = Array.from(this.agents.values())
      .filter(
        (agent) => agent.status === "online" && agent.id !== excludeAgentId
      )
      .sort((a, b) => b.reliability - a.reliability);

    return candidates.slice(0, 3); // Return top 3 fallbacks
  }

  /**
   * Update agent metrics after task completion
   */
  updateAgentMetrics(
    agentId: string,
    success: boolean,
    responseTime: number
  ): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update reliability (exponential moving average)
    agent.reliability = agent.reliability * 0.9 + (success ? 1 : 0) * 0.1;

    // Update response time (exponential moving average)
    agent.responseTime = agent.responseTime * 0.8 + responseTime * 0.2;

    // Update last seen
    agent.lastSeen = new Date();
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentProfile[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentProfile | undefined {
    return this.agents.get(agentId);
  }
}
