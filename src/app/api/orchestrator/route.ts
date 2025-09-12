import { NextRequest, NextResponse } from "next/server";
import { NextJSOrchestratorService } from "@/lib/orchestratorService";

// Global orchestrator service instance
let orchestratorService: NextJSOrchestratorService;

// Initialize orchestrator service
if (!orchestratorService) {
  orchestratorService = new NextJSOrchestratorService();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case "discover_agents":
        result = await orchestratorService.discoverAgents(data);
        break;

      case "orchestrate_quiz_workflow":
        result = await orchestratorService.orchestrateQuizWorkflow(data);
        break;

      case "monitor_system_health":
        result = await orchestratorService.monitorSystemHealth(data);
        break;

      case "get_chat_history":
        result = orchestratorService.getChatHistory();
        break;

      case "get_workflow_chat_history":
        result = orchestratorService.getWorkflowChatHistory(data.workflowId);
        break;

      case "clear_chat_history":
        orchestratorService.clearChatHistory();
        result = { success: true };
        break;

      case "get_workflows":
        result = orchestratorService.getAllWorkflows();
        break;

      case "get_workflow":
        result = orchestratorService.getWorkflow(data.workflowId);
        break;

      case "get_agents":
        result = orchestratorService.getAllAgents();
        break;

      case "get_agent":
        result = orchestratorService.getAgent(data.url);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Orchestrator API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    let result;

    switch (action) {
      case "health":
        result = { status: "ok", service: "nextjs-orchestrator" };
        break;

      case "status":
        result = {
          orchestrator: {
            status: "running",
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: "1.0.0",
          },
          agents: {
            discovered: orchestratorService.getAllAgents().length,
            active: orchestratorService
              .getAllAgents()
              .filter((a) => a.status === "online").length,
            last_discovery: new Date().toISOString(),
          },
        };
        break;

      case "chat_history":
        result = orchestratorService.getChatHistory();
        break;

      case "workflows":
        result = orchestratorService.getAllWorkflows();
        break;

      case "agents":
        result = orchestratorService.getAllAgents();
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Orchestrator GET API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
