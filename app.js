import { existsSync } from "fs";
import { spawn, spawnSync } from "child_process";
import { join } from "path";

const backendDir = join(process.cwd(), "backend");
const backendApp = join(backendDir, "app.js");
const backendModules = join(backendDir, "node_modules");

if (!existsSync(backendApp)) {
  console.error("Backend app not found. Set Render Root Directory to backend or deploy from the repository root.");
  process.exit(1);
}

if (!existsSync(backendModules)) {
  console.log("Installing backend dependencies...");
  const install = spawnSync("npm", ["install", "--prefix", backendDir], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (install.status !== 0) {
    process.exit(install.status || 1);
  }
}

const child = spawn("node", [backendApp], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});