"use client";

/**
 * Next.js Compatible A2A Server for Frontend Agent
 * This provides A2A functionality through Next.js API routes instead of Express
 */
export class FrontendA2AServer {
  private port: number;
  private isRunning: boolean = false;

  constructor(port: number = 3000) {
    this.port = port;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("A2A server is already running");
      return;
    }

    // In Next.js, the "server" is the Next.js dev server itself
    // We just need to ensure the API routes are available
    this.isRunning = true;
    console.log(`Frontend A2A Agent available via Next.js API routes`);
    console.log(
      `Agent Card: http://localhost:${this.port}/api/.well-known/agent-card`
    );
    console.log(`Health Check: http://localhost:${this.port}/api/health`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log("Frontend A2A server stopped");
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      agentCardUrl: `http://localhost:${this.port}/api/.well-known/agent-card`,
      healthUrl: `http://localhost:${this.port}/api/health`,
      type: "Next.js API Routes",
    };
  }
}

// Singleton instance
let frontendA2AServer: FrontendA2AServer | null = null;

export function getFrontendA2AServer(port?: number): FrontendA2AServer {
  if (!frontendA2AServer) {
    frontendA2AServer = new FrontendA2AServer(port);
  }
  return frontendA2AServer;
}

export async function startFrontendA2AServer(
  port?: number
): Promise<FrontendA2AServer> {
  const server = getFrontendA2AServer(port);
  await server.start();
  return server;
}

export async function stopFrontendA2AServer(): Promise<void> {
  if (frontendA2AServer) {
    await frontendA2AServer.stop();
    frontendA2AServer = null;
  }
}
