import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { ApiError, normalizeApiError } from "./api-error";
import { HTTP_STATUS } from "./http-status";

test("keeps explicitly defined API errors", () => {
  const expected = new ApiError({
    status: HTTP_STATUS.FORBIDDEN,
    code: "ACCESS_DENIED",
    message: "Access denied",
  });

  assert.equal(normalizeApiError(expected), expected);
});

test("normalizes validation errors without losing field paths", () => {
  const result = z.object({ email: z.string().email() }).safeParse({ email: "invalid" });
  assert.equal(result.success, false);
  if (result.success) return;

  const normalized = normalizeApiError(result.error);

  assert.equal(normalized.status, HTTP_STATUS.BAD_REQUEST);
  assert.equal(normalized.code, "VALIDATION_ERROR");
  assert.deepEqual(normalized.details, [
    { path: "email", message: "Invalid email address" },
  ]);
});

test("does not expose unexpected error details", () => {
  const normalized = normalizeApiError(new Error("database credentials leaked"));

  assert.equal(normalized.status, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  assert.equal(normalized.code, "INTERNAL_SERVER_ERROR");
  assert.equal(normalized.message, "Internal server error");
  assert.equal(normalized.details, undefined);
});
