#!/usr/bin/env node

/**
 * Startup script for Manual Creator Integration
 * Starts all required services in the correct order
 */

const { spawn } = require("child_process");
const path = require("path");

const services = [
  {
    name: "Manual Creator Agent",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(__dirname, "..", "manual-creator-agentic"),
    port: 4002,
    url: "http://localhost:4002",
  },
  {
    name: "Quiz Creator Agent",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(__dirname, "..", "quiz-creator-agentic"),
    port: 4001,
    url: "http://localhost:4001",
  },
  {
    name: "Orchestrator Server",
    command: "node",
    args: ["orchestrator-server.js"],
    cwd: __dirname,
    port: 5000,
    url: "http://localhost:5000",
  },
  {
    name: "Frontend (Next.js)",
    command: "npm",
    args: ["run", "dev"],
    cwd: __dirname,
    port: 3000,
    url: "http://localhost:3000",
  },
];

const runningServices = [];

function startService(service) {
  console.log(`🚀 Starting ${service.name}...`);

  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: "pipe",
    shell: true,
  });

  child.stdout.on("data", (data) => {
    const output = data.toString();
    if (
      output.includes("listening") ||
      output.includes("ready") ||
      output.includes("started")
    ) {
      console.log(`✅ ${service.name} is running on port ${service.port}`);
    }
  });

  child.stderr.on("data", (data) => {
    const error = data.toString();
    if (error.includes("Error") || error.includes("error")) {
      console.error(`❌ ${service.name} error:`, error);
    }
  });

  child.on("close", (code) => {
    console.log(`🛑 ${service.name} exited with code ${code}`);
  });

  runningServices.push({
    ...service,
    process: child,
  });

  return child;
}

function waitForService(service, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkService = async () => {
      try {
        const axios = require("axios");
        const response = await axios.get(`${service.url}/health`, {
          timeout: 2000,
        });
        console.log(`✅ ${service.name} health check passed`);
        resolve(true);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.log(
            `⚠️ ${service.name} health check failed after ${maxAttempts} attempts`
          );
          resolve(false);
        } else {
          setTimeout(checkService, 2000);
        }
      }
    };

    setTimeout(checkService, 3000); // Wait 3 seconds before first check
  });
}

async function startAllServices() {
  console.log("🎯 Starting Manual Creator Integration Services\n");

  // Start services in order
  for (const service of services) {
    startService(service);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between starts
  }

  console.log("\n⏳ Waiting for services to be ready...\n");

  // Wait for all services to be healthy
  const healthChecks = await Promise.all(
    services.map((service) => waitForService(service))
  );

  const healthyServices = healthChecks.filter(Boolean).length;

  console.log(
    `\n📊 Service Status: ${healthyServices}/${services.length} services healthy`
  );

  if (healthyServices === services.length) {
    console.log("\n🎉 All services are running successfully!");
    console.log("\n📋 Service URLs:");
    services.forEach((service) => {
      console.log(`  • ${service.name}: ${service.url}`);
    });

    console.log("\n🔗 Quick Links:");
    console.log(`  • Frontend: http://localhost:3000`);
    console.log(`  • Orchestrator Health: http://localhost:5000/health`);
    console.log(`  • Manual Creator Health: http://localhost:4002/health`);
    console.log(`  • Quiz Creator Health: http://localhost:4001/health`);

    console.log("\n🧪 Run integration tests:");
    console.log("  node test-manual-integration.js");
  } else {
    console.log(
      "\n⚠️ Some services failed to start properly. Check the logs above."
    );
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down services...");
    runningServices.forEach((service) => {
      if (service.process) {
        service.process.kill();
      }
    });
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down services...");
    runningServices.forEach((service) => {
      if (service.process) {
        service.process.kill();
      }
    });
    process.exit(0);
  });
}

// Run if this script is executed directly
if (require.main === module) {
  startAllServices().catch((error) => {
    console.error("💥 Startup failed:", error);
    process.exit(1);
  });
}

module.exports = {
  startAllServices,
  services,
};
