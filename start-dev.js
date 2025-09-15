#!/usr/bin/env node

/**
 * Development Script to run both Frontend and Orchestrator
 * This script starts both services concurrently
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting Quiz Application Services...\n");

// Start Frontend (Next.js)
console.log("📱 Starting Frontend on port 3000...");
const frontend = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname),
  stdio: "pipe",
  shell: true,
});

// Start Orchestrator
console.log("🎯 Starting Orchestrator on port 5000...");
const orchestrator = spawn("node", ["orchestrator-server.js"], {
  cwd: path.join(__dirname),
  stdio: "pipe",
  shell: true,
});

// Handle frontend output
frontend.stdout.on("data", (data) => {
  console.log(`[Frontend] ${data.toString().trim()}`);
});

frontend.stderr.on("data", (data) => {
  console.log(`[Frontend Error] ${data.toString().trim()}`);
});

// Handle orchestrator output
orchestrator.stdout.on("data", (data) => {
  console.log(`[Orchestrator] ${data.toString().trim()}`);
});

orchestrator.stderr.on("data", (data) => {
  console.log(`[Orchestrator Error] ${data.toString().trim()}`);
});

// Handle process exits
frontend.on("close", (code) => {
  console.log(`Frontend process exited with code ${code}`);
});

orchestrator.on("close", (code) => {
  console.log(`Orchestrator process exited with code ${code}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down services...");
  frontend.kill("SIGINT");
  orchestrator.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down services...");
  frontend.kill("SIGTERM");
  orchestrator.kill("SIGTERM");
  process.exit(0);
});

console.log("\n✅ Services started successfully!");
console.log("📱 Frontend: http://localhost:3000");
console.log("🎯 Orchestrator: http://localhost:5000");
console.log("📊 Orchestrator Health: http://localhost:5000/health");
console.log("\nPress Ctrl+C to stop all services\n");
