import { NextRequest, NextResponse } from "next/server";
import { NextJSOrchestratorService } from "@/lib/orchestratorService";

// Global orchestrator service instance
let orchestratorService: NextJSOrchestratorService | undefined;

// Initialize orchestrator service
function getOrchestratorService(): NextJSOrchestratorService {
  if (!orchestratorService) {
    orchestratorService = new NextJSOrchestratorService();
  }
  return orchestratorService;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case "discover_agents":
        result = await getOrchestratorService().discoverAgents(data);
        break;

      case "orchestrate_quiz_workflow":
        result = await getOrchestratorService().orchestrateQuizWorkflow(data);
        break;

      case "monitor_system_health":
        result = await getOrchestratorService().monitorSystemHealth(data);
        break;

      case "get_chat_history":
        result = getOrchestratorService().getChatHistory();
        break;

      case "get_workflow_chat_history":
        result = getOrchestratorService().getWorkflowChatHistory(
          data.workflowId
        );
        break;

      case "clear_chat_history":
        getOrchestratorService().clearChatHistory();
        result = { success: true };
        break;

      case "get_workflows":
        result = getOrchestratorService().getAllWorkflows();
        break;

      case "get_workflow":
        result = getOrchestratorService().getWorkflow(data.workflowId);
        break;

      case "get_agents":
        result = getOrchestratorService().getAllAgents();
        break;

      case "get_agent":
        result = getOrchestratorService().getAgent(data.url);
        break;

      case "determine_agent_for_query":
        result = getOrchestratorService().determineAgentForQuery(
          data.query,
          data.context
        );
        break;

      case "execute_agent_with_resilience":
        result = await getOrchestratorService().executeAgentWithResilience(
          data.query,
          data.context
        );
        break;

      case "handle_general_mcp_query":
        result = await getOrchestratorService().handleGeneralMCPQuery(data);
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
            discovered: getOrchestratorService().getAllAgents().length,
            active: getOrchestratorService()
              .getAllAgents()
              .filter((a) => a.status === "online").length,
            last_discovery: new Date().toISOString(),
          },
        };
        break;

      case "chat_history":
        result = getOrchestratorService().getChatHistory();
        break;

      case "workflows":
        result = getOrchestratorService().getAllWorkflows();
        break;

      case "agents":
        result = getOrchestratorService().getAllAgents();
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
