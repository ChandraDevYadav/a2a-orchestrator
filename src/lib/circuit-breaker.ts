/**
 * Circuit Breaker Pattern for Agent Resilience
 * Prevents cascading failures and provides graceful degradation
 */

export interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime?: Date;
  successCount: number;
}

export class AgentCircuitBreaker {
  private breakers: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold: number;
  private readonly timeoutMs: number;
  private readonly successThreshold: number;

  constructor(
    failureThreshold: number = 5,
    timeoutMs: number = 60000, // 1 minute
    successThreshold: number = 3
  ) {
    this.failureThreshold = failureThreshold;
    this.timeoutMs = timeoutMs;
    this.successThreshold = successThreshold;
  }

  /**
   * Check if agent is available (circuit breaker allows)
   */
  isAgentAvailable(agentId: string): boolean {
    const breaker = this.breakers.get(agentId);
    if (!breaker) return true; // No breaker = available

    switch (breaker.state) {
      case "closed":
        return true;
      case "open":
        // Check if timeout has passed
        if (
          breaker.lastFailureTime &&
          Date.now() - breaker.lastFailureTime.getTime() > this.timeoutMs
        ) {
          breaker.state = "half-open";
          breaker.successCount = 0;
          return true;
        }
        return false;
      case "half-open":
        return true;
      default:
        return true;
    }
  }

  /**
   * Record a successful operation
   */
  recordSuccess(agentId: string): void {
    const breaker = this.breakers.get(agentId) || this.createBreaker(agentId);

    breaker.successCount++;
    breaker.failureCount = 0;

    if (
      breaker.state === "half-open" &&
      breaker.successCount >= this.successThreshold
    ) {
      breaker.state = "closed";
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(agentId: string): void {
    const breaker = this.breakers.get(agentId) || this.createBreaker(agentId);

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= this.failureThreshold) {
      breaker.state = "open";
    }
  }

  private createBreaker(agentId: string): CircuitBreakerState {
    const breaker: CircuitBreakerState = {
      state: "closed",
      failureCount: 0,
      successCount: 0,
    };
    this.breakers.set(agentId, breaker);
    return breaker;
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getStatus(agentId: string): CircuitBreakerState | null {
    return this.breakers.get(agentId) || null;
  }

  /**
   * Reset circuit breaker (for manual intervention)
   */
  reset(agentId: string): void {
    this.breakers.delete(agentId);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Map<string, CircuitBreakerState> {
    return new Map(this.breakers);
  }
}
