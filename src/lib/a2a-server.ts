"use client";

/**
 * Browser-Compatible A2A Server
 * Provides A2A server functionality with SSR safety
 */
export class FrontendAgentExecutor {
  async cancelTask(taskId: string): Promise<void> {
    console.log(`Cancelling frontend task: ${taskId}`);
  }

  async execute(requestContext: any, eventBus: any): Promise<void> {
    const { taskId, contextId } = requestContext;

    // Initialize the task status as "submitted"
    const initial = {
      kind: "task",
      id: taskId,
      contextId,
      status: {
        state: "submitted",
        timestamp: new Date().toISOString(),
      },
    };

    // Publish the initial task status
    eventBus.publish(initial);

    // Access skillId and input through the request property
    const incoming = requestContext.request ?? {};
    const skillId = incoming.skillId || "unknown";
    const input = incoming.input || {};

    try {
      // Handle different frontend skills
      switch (skillId) {
        case "create_quiz_interface":
          await this.handleCreateQuizInterface(
            taskId,
            contextId,
            input,
            eventBus
          );
          break;
        case "display_quiz":
          await this.handleDisplayQuiz(taskId, contextId, input, eventBus);
          break;
        case "take_quiz":
          await this.handleTakeQuiz(taskId, contextId, input, eventBus);
          break;
        case "orchestrate_quiz_generation":
          await this.handleOrchestrateQuizGeneration(
            taskId,
            contextId,
            input,
            eventBus
          );
          break;
        default:
          throw new Error(`Unknown skill: ${skillId}`);
      }
    } catch (error) {
      // Publish error status
      const errorStatus = {
        kind: "status-update",
        taskId,
        contextId,
        status: {
          state: "failed",
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(errorStatus);
      eventBus.finished();
    }
  }

  private async handleCreateQuizInterface(
    taskId: string,
    contextId: string,
    input: any,
    eventBus: any
  ) {
    // Create quiz interface artifact
    const artifact = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "quiz-interface-1",
        name: "quiz_creation_interface.json",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              interface: "quiz_creation_form",
              status: "ready",
              input: input,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      },
    };

    eventBus.publish(artifact);

    // Complete task
    const statusUpdate = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "completed", timestamp: new Date().toISOString() },
      final: true,
    };
    eventBus.publish(statusUpdate);
    eventBus.finished();
  }

  private async handleDisplayQuiz(
    taskId: string,
    contextId: string,
    input: any,
    eventBus: any
  ) {
    // Display quiz artifact
    const artifact = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "quiz-display-1",
        name: "quiz_display_interface.json",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              interface: "quiz_display",
              status: "rendered",
              quiz_data: input.quiz_data,
              mode: input.mode || "display",
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      },
    };

    eventBus.publish(artifact);

    // Complete task
    const statusUpdate = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "completed", timestamp: new Date().toISOString() },
      final: true,
    };
    eventBus.publish(statusUpdate);
    eventBus.finished();
  }

  private async handleTakeQuiz(
    taskId: string,
    contextId: string,
    input: any,
    eventBus: any
  ) {
    // Take quiz artifact
    const artifact = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "quiz-taker-1",
        name: "quiz_taker_interface.json",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              interface: "quiz_taker",
              status: "active",
              quiz_data: input.quiz_data,
              mode: input.mode || "take",
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      },
    };

    eventBus.publish(artifact);

    // Complete task
    const statusUpdate = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "completed", timestamp: new Date().toISOString() },
      final: true,
    };
    eventBus.publish(statusUpdate);
    eventBus.finished();
  }

  private async handleOrchestrateQuizGeneration(
    taskId: string,
    contextId: string,
    input: any,
    eventBus: any
  ) {
    // Orchestration artifact
    const artifact = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "orchestration-1",
        name: "quiz_orchestration.json",
        parts: [
          {
            kind: "text",
            text: JSON.stringify({
              orchestration: "initiated",
              status: "coordinating",
              target_agent: input.target_agent || "quiz-backend",
              content: input.content,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      },
    };

    eventBus.publish(artifact);

    // Complete task
    const statusUpdate = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "completed", timestamp: new Date().toISOString() },
      final: true,
    };
    eventBus.publish(statusUpdate);
    eventBus.finished();
  }
}

/**
 * A2A Server Setup for Frontend Agent
 * Creates proper A2A server components with SSR safety
 */
export class FrontendA2AServer {
  private taskStore: any;
  private executor: FrontendAgentExecutor;
  private requestHandler: any;
  private isRunning: boolean = false;

  constructor() {
    this.executor = new FrontendAgentExecutor();
    // Initialize SDK components lazily
    this.initializeComponents();
  }

  private async initializeComponents() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const sdk = await import("@a2a-js/sdk/server");
      const agentCard = (await import("../../agent-card.json")).default;

      this.taskStore = new sdk.InMemoryTaskStore();
      this.requestHandler = new sdk.DefaultRequestHandler(
        agentCard,
        this.taskStore,
        this.executor
      );
    } catch (error) {
      console.error("Failed to initialize A2A server components:", error);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("A2A server is already running");
      return;
    }

    this.isRunning = true;
    console.log("Frontend A2A Agent initialized");
    console.log(`Agent Card: http://localhost:3000/api/.well-known/agent-card`);
    console.log(`Health Check: http://localhost:3000/api/health`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log("Frontend A2A server stopped");
  }

  getRequestHandler(): any {
    return this.requestHandler;
  }

  getTaskStore(): any {
    return this.taskStore;
  }

  getExecutor(): FrontendAgentExecutor {
    return this.executor;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: 3000,
      agentCardUrl: `http://localhost:3000/api/.well-known/agent-card`,
      healthUrl: `http://localhost:3000/api/health`,
      type: "Browser-Compatible A2A Server",
    };
  }
}

// Export singleton instance
export const frontendAgentExecutor = new FrontendAgentExecutor();
let frontendA2AServer: FrontendA2AServer | null = null;

export function getFrontendA2AServer(): FrontendA2AServer {
  if (!frontendA2AServer) {
    frontendA2AServer = new FrontendA2AServer();
  }
  return frontendA2AServer;
}

export async function startFrontendA2AServer(): Promise<FrontendA2AServer> {
  const server = getFrontendA2AServer();
  await server.start();
  return server;
}

export async function stopFrontendA2AServer(): Promise<void> {
  if (frontendA2AServer) {
    await frontendA2AServer.stop();
    frontendA2AServer = null;
  }
}
