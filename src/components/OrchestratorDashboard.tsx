"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from "ag-grid-community";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Network,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Activity,
  Bot,
  Zap,
} from "lucide-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface AgentData {
  name: string;
  url: string;
  skills: string[];
  status: "online" | "offline" | "unknown";
  lastSeen: string;
  capabilities?: any;
}

interface WorkflowData {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  steps: any[];
}

interface SystemHealth {
  overall_health: "healthy" | "degraded" | "unhealthy";
  agents: Array<{
    agent: string;
    url: string;
    status: "healthy" | "unhealthy";
    response_time?: string;
  }>;
}

export function OrchestratorDashboard() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadOrchestratorData();
  }, []);

  const loadOrchestratorData = async () => {
    setIsLoading(true);
    try {
      const [agentsRes, workflowsRes, healthRes] = await Promise.all([
        fetch("/api/orchestrator?action=agents"),
        fetch("/api/orchestrator?action=workflows"),
        fetch("/api/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "monitor_system_health",
            check_all: true,
          }),
        }),
      ]);

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orchestrator data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const discoverAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover_agents", network_scan: true }),
      });

      if (response.ok) {
        const result = await response.json();
        setAgents(result.agents || []);

        toast({
          title: "Success",
          description: `Discovered ${result.count} agents`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to discover agents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeWorkflow = async (topic: string) => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for the quiz",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "orchestrate_quiz_workflow",
          topic: topic,
          difficulty: "intermediate",
          question_count: 5,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: "Success",
          description: `Workflow ${result.workflow_id} completed successfully`,
        });

        // Refresh data
        await loadOrchestratorData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "healthy":
      case "completed":
        return "bg-green-500";
      case "offline":
      case "unhealthy":
      case "failed":
        return "bg-red-500";
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // AG-Grid column definitions for agents
  const agentColumnDefs: ColDef[] = [
    {
      headerName: "Name",
      field: "name",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "URL",
      field: "url",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Status",
      field: "status",
      sortable: true,
      filter: true,
      width: 100,
      cellRenderer: (params: any) => {
        const status = params.value;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      headerName: "Skills",
      field: "skills",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => {
        const skills = params.value || [];
        return (
          <div className="flex flex-wrap gap-1">
            {skills.map((skill: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      headerName: "Last Seen",
      field: "lastSeen",
      sortable: true,
      filter: true,
      width: 150,
      cellRenderer: (params: any) => {
        return new Date(params.value).toLocaleString();
      },
    },
  ];

  // AG-Grid column definitions for workflows
  const workflowColumnDefs: ColDef[] = [
    {
      headerName: "ID",
      field: "id",
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      headerName: "Name",
      field: "name",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Status",
      field: "status",
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params: any) => {
        const status = params.value;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      headerName: "Created",
      field: "createdAt",
      sortable: true,
      filter: true,
      width: 150,
      cellRenderer: (params: any) => {
        return new Date(params.value).toLocaleString();
      },
    },
    {
      headerName: "Completed",
      field: "completedAt",
      sortable: true,
      filter: true,
      width: 150,
      cellRenderer: (params: any) => {
        return params.value ? new Date(params.value).toLocaleString() : "-";
      },
    },
    {
      headerName: "Steps",
      field: "steps",
      sortable: true,
      filter: true,
      width: 100,
      cellRenderer: (params: any) => {
        const steps = params.value || [];
        return steps.length;
      },
    },
  ];

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  };

  const onRowClicked = (event: any) => {
    setSelectedAgent(event.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Network className="h-8 w-8" />
          Orchestrator Dashboard
        </h1>
        <div className="flex gap-2">
          <Button onClick={discoverAgents} disabled={isLoading}>
            <Settings className="h-4 w-4 mr-2" />
            Discover Agents
          </Button>
          <Button onClick={loadOrchestratorData} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Overall system status:
              <Badge
                className={`ml-2 ${getStatusColor(
                  systemHealth.overall_health
                )}`}
              >
                {systemHealth.overall_health}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemHealth.agents.map((agent, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      agent.status
                    )}`}
                  />
                  <span className="text-sm font-medium">{agent.agent}</span>
                  {agent.response_time && (
                    <span className="text-xs text-gray-500">
                      ({agent.response_time})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Execute common orchestrator tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter quiz topic..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeWorkflow(e.currentTarget.value);
                  }
                }}
              />
            </div>
            <Button
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder="Enter quiz topic..."]'
                ) as HTMLInputElement;
                if (input) {
                  executeWorkflow(input.value);
                }
              }}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Execute Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Discovered Agents ({agents.length})
          </CardTitle>
          <CardDescription>
            A2A agents discovered in the network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="ag-theme-alpine"
            style={{ height: 300, width: "100%" }}
          >
            <AgGridReact
              columnDefs={agentColumnDefs}
              rowData={agents}
              onGridReady={onGridReady}
              onRowClicked={onRowClicked}
              rowSelection="single"
              animateRows={true}
              pagination={true}
              paginationPageSize={10}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflows Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Workflow Executions ({workflows.length})
          </CardTitle>
          <CardDescription>
            Recent workflow executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="ag-theme-alpine"
            style={{ height: 300, width: "100%" }}
          >
            <AgGridReact
              columnDefs={workflowColumnDefs}
              rowData={workflows}
              onGridReady={onGridReady}
              animateRows={true}
              pagination={true}
              paginationPageSize={10}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
            <CardDescription>
              Detailed information about the selected agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedAgent.name}
                  </div>
                  <div>
                    <strong>URL:</strong> {selectedAgent.url}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <Badge
                      className={`ml-2 ${getStatusColor(selectedAgent.status)}`}
                    >
                      {selectedAgent.status}
                    </Badge>
                  </div>
                  <div>
                    <strong>Last Seen:</strong>{" "}
                    {new Date(selectedAgent.lastSeen).toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
