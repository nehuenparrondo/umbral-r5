import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

function hostingOrigins(overrides) {
  const configurationUrl = new URL("../config/env.js", import.meta.url).href;
  const source = `const {env}=await import(${JSON.stringify(configurationUrl)});console.log(JSON.stringify({server:env.serverOrigin,clients:env.clientOrigins}));`;
  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", source],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "mysql://test:unused@localhost/unused",
        JWT_SECRET: "hosting-tests-use-only-this-unused-secret",
        SERVER_ORIGIN: "",
        CLIENT_ORIGIN: "",
        ...overrides,
      },
    },
  );
  return JSON.parse(output.trim());
}

test("Render usa su dominio HTTPS para API y cookies sin adivinar la URL pública", () => {
  assert.deepEqual(
    hostingOrigins({
      NODE_ENV: "production",
      RENDER_EXTERNAL_URL: "https://umbral-test.onrender.com/",
    }),
    {
      server: "https://umbral-test.onrender.com",
      clients: ["https://umbral-test.onrender.com"],
    },
  );
});

test("Los orígenes explícitos conservan prioridad sobre Render", () => {
  assert.deepEqual(
    hostingOrigins({
      NODE_ENV: "production",
      RENDER_EXTERNAL_URL: "https://unused.onrender.com",
      SERVER_ORIGIN: "https://api.example.test",
      CLIENT_ORIGIN: "https://app.example.test",
    }),
    {
      server: "https://api.example.test",
      clients: ["https://app.example.test"],
    },
  );
});

test("El desarrollo local no adopta una URL de Render residual", () => {
  assert.deepEqual(
    hostingOrigins({
      NODE_ENV: "development",
      RENDER_EXTERNAL_URL: "https://unused.onrender.com",
    }),
    {
      server: "http://localhost:4000",
      clients: ["http://localhost:5173"],
    },
  );
});
