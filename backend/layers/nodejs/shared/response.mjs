const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://note.domain.app";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

export function success(body) {
  return buildResponse(200, body);
}

export function created(body) {
  return buildResponse(201, body);
}

export function badRequest(message) {
  return buildResponse(400, { message });
}

export function unauthorized(message = "Unauthorized") {
  return buildResponse(401, { message });
}

export function notFound(message = "Resource not found") {
  return buildResponse(404, { message });
}

export function error(statusCode, message, err = null) {
  const body = { message };
  if (err) {
    body.error = {
      name: err.name,
      details: err.message,
      ...(err.code && { code: err.code }),
    };
  }
  return buildResponse(statusCode, body);
}
