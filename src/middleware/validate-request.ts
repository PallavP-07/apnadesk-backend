import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export function validateRequest(
  schema: ZodType,
  part: RequestPart = "body",
): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request[part]);

    if (!result.success) {
      next(result.error);
      return;
    }

    request.validated = {
      ...request.validated,
      [part]: result.data,
    };

    if (part === "body") {
      request.body = result.data;
    }

    next();
  };
}
