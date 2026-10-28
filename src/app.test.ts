import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { app } from "./app";

test("HTTP app returns health, not-found, and normalized parser errors", async (context) => {
  const server = app.listen(0);
  await once(server, "listening");

  context.after(async () => {
    const closed = once(server, "close");
    server.closeAllConnections();
    server.close();
    await closed;
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const liveResponse = await fetch(`${baseUrl}/api/v1/health/live`);
  assert.equal(liveResponse.status, 200);
  assert.deepEqual(await liveResponse.json(), { status: "ok" });

  const notFoundResponse = await fetch(`${baseUrl}/api/v1/missing`);
  assert.equal(notFoundResponse.status, 404);
  const notFound = await notFoundResponse.json();
  assert.equal(notFound.error.code, "ROUTE_NOT_FOUND");
  assert.equal(notFound.error.message, "The requested route was not found");
  assert.ok(notFound.error.requestId);

  const invalidJsonResponse = await fetch(`${baseUrl}/api/v1/health/live`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid",
  });
  assert.equal(invalidJsonResponse.status, 400);
  const invalidJson = await invalidJsonResponse.json();
  assert.equal(invalidJson.error.code, "INVALID_JSON");
  assert.equal(invalidJson.error.message, "Request body contains invalid JSON");
  assert.ok(invalidJson.error.requestId);
});
