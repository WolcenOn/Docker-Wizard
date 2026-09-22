const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("compose-pro.js", "utf8");

function generate(overrides = {}) {
  const state = {
    appType: "api",
    runtime: "python",
    framework: "fastapi",
    port: 8000,
    frontendPort: 5173,
    frontendFramework: "react",
    production: false,
    services: new Set(["postgres"]),
    ...overrides
  };

  const sandbox = { state };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  return {
    compose: sandbox.composeTemplate(),
    dev: sandbox.composeDevTemplate(),
    prod: sandbox.composeProdTemplate(),
    nginx: sandbox.nginxConfigTemplate(),
    env: sandbox.envTemplate(),
    frontendDockerfile: sandbox.frontendDockerfileTemplate()
  };
}

const api = generate();
assert.equal(api.compose.includes("\n  frontend:"), false, "API-only must not add a frontend service");
assert.equal(api.env.includes("FRONTEND_API_URL"), false, "API-only must not add frontend variables");

const proxied = generate({
  appType: "fullstack",
  services: new Set(["postgres", "redis", "nginx"])
});
assert.match(proxied.compose, /\n  frontend:/);
assert.match(proxied.compose, /frontend:\n        condition: service_healthy/);
assert.match(proxied.nginx, /location \/api\//);
assert.match(proxied.nginx, /proxy_pass http:\/\/frontend:80/);
assert.match(proxied.env, /FRONTEND_API_URL=\/api/);
assert.match(proxied.prod, /frontend:\n    restart: unless-stopped/);
assert.match(proxied.frontendDockerfile, /FROM deps AS build/);
assert.match(proxied.frontendDockerfile, /FROM nginx:1\.27-alpine AS runtime/);

const direct = generate({
  appType: "fullstack",
  runtime: "node",
  framework: "express",
  port: 3000,
  frontendPort: 5173,
  frontendFramework: "vue",
  services: new Set(["mongo"])
});
assert.match(direct.compose, /- "3000:3000"/);
assert.match(direct.compose, /- "5173:80"/);
assert.equal(direct.compose.includes("\n  nginx:"), false);
assert.match(direct.env, /FRONTEND_API_URL=http:\/\/localhost:3000/);

for (const output of [api, proxied, direct]) {
  for (const value of Object.values(output)) {
    assert.equal(String(value).includes("undefined"), false, "Generated output must not contain undefined");
  }
}

console.log("Docker Wizard generator smoke tests passed.");
