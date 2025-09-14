"use client";

import {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
  InMemoryTaskStore,
} from "@a2a-js/sdk/server";
import {
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
  Task,
} from "@a2a-js/sdk";
import agentCard from "../../agent-card.json";

/**
 * Real Frontend Agent Executor using @a2a-js/sdk/server
 * Handles A2A protocol requests with proper SDK implementation
 */
export class RealFrontendAgentExecutor implements AgentExecutor {
  async cancelTask(taskId: string): Promise<void> {
    console.log(`Cancelling frontend task: ${taskId}`);
  }

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const { taskId, contextId } = requestContext;

    // Initialize the task status as "submitted"
    const initial: Task = {
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
    const incoming = (requestContext as any).request ?? {};
    const skillId = incoming.skillId || "unknown";
    const input = incoming.input || {};

    try {
      // Handle different frontend skills using real A2A protocol
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
      const errorStatus: TaskStatusUpdateEvent = {
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
    eventBus: ExecutionEventBus
  ) {
    // Create quiz interface artifact
    const artifact: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "quiz-interface-1",
        name: "quiz_creation_interface.json",
        parts: [
          {
            kind: "text" as const,
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
    const statusUpdate: TaskStatusUpdateEvent = {
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
    eventBus: ExecutionEventBus
  ) {
    // Display quiz artifact
    const artifact: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "quiz-display-1",
        name: "quiz_display_interface.json",
        parts: [
          {
            kind: "text" as const,
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
    const statusUpdate: TaskStatusUpdateEvent = {
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
    eventBus: ExecutionEventBus
  ) {
    // Take quiz artifact
    const artifact: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "quiz-taker-1",
        name: "quiz_taker_interface.json",
        parts: [
          {
            kind: "text" as const,
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
    const statusUpdate: TaskStatusUpdateEvent = {
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
    eventBus: ExecutionEventBus
  ) {
    // Orchestration artifact
    const artifact: TaskArtifactUpdateEvent = {
      kind: "artifact-update",
      taskId,
      contextId,
      artifact: {
        artifactId: "orchestration-1",
        name: "quiz_orchestration.json",
        parts: [
          {
            kind: "text" as const,
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
    const statusUpdate: TaskStatusUpdateEvent = {
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
 * Real A2A Server Setup for Frontend Agent
 * Creates proper A2A server components using the SDK
 */
export class RealFrontendA2AServer {
  private taskStore: InMemoryTaskStore;
  private executor: RealFrontendAgentExecutor;
  private requestHandler: DefaultRequestHandler;
  private isRunning: boolean = false;

  constructor() {
    this.taskStore = new InMemoryTaskStore();
    this.executor = new RealFrontendAgentExecutor();
    this.requestHandler = new DefaultRequestHandler(
      agentCard as any,
      this.taskStore,
      this.executor
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Real A2A server is already running");
      return;
    }

    this.isRunning = true;
    console.log("Real Frontend A2A Agent initialized with SDK");
    console.log(`Agent Card: http://localhost:3000/api/.well-known/agent-card`);
    console.log(`Health Check: http://localhost:3000/api/health`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log("Real Frontend A2A server stopped");
  }

  getRequestHandler(): DefaultRequestHandler {
    return this.requestHandler;
  }

  getTaskStore(): InMemoryTaskStore {
    return this.taskStore;
  }

  getExecutor(): RealFrontendAgentExecutor {
    return this.executor;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: 3000,
      agentCardUrl: `http://localhost:3000/api/.well-known/agent-card`,
      healthUrl: `http://localhost:3000/api/health`,
      type: "Real A2A SDK Server",
    };
  }
}

// Export singleton instance
export const realFrontendAgentExecutor = new RealFrontendAgentExecutor();
let realFrontendA2AServer: RealFrontendA2AServer | null = null;

export function getRealFrontendA2AServer(): RealFrontendA2AServer {
  if (!realFrontendA2AServer) {
    realFrontendA2AServer = new RealFrontendA2AServer();
  }
  return realFrontendA2AServer;
}

export async function startRealFrontendA2AServer(): Promise<RealFrontendA2AServer> {
  const server = getRealFrontendA2AServer();
  await server.start();
  return server;
}

export async function stopRealFrontendA2AServer(): Promise<void> {
  if (realFrontendA2AServer) {
    await realFrontendA2AServer.stop();
    realFrontendA2AServer = null;
  }
}
