"use client";

import {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from "@a2a-js/sdk/server";
import { TaskArtifactUpdateEvent, TaskStatusUpdateEvent } from "@a2a-js/sdk";
import agentCard from "../../agent-card.json";

/**
 * Frontend Agent Executor - handles A2A protocol requests
 */
export class FrontendAgentExecutor implements AgentExecutor {
  async cancelTask(taskId: string): Promise<void> {
    // Frontend tasks are typically short-lived, cancellation not critical
    console.log(`Cancelling frontend task: ${taskId}`);
  }

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const { taskId, contextId } = requestContext;

    // Access skillId and input through the request property
    const incoming = (requestContext as any).request ?? {};
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

// Export the executor instance
export const frontendAgentExecutor = new FrontendAgentExecutor();
