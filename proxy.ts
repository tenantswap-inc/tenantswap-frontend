import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "https://example.com",
    "https://app.example.com",
    "http://localhost:8000",
    "*"
  ];

  const isAllowed = allowedOrigins.includes(origin);

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        // Include if you need credential support
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // Add CORS headers to all responses
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

// Apply only to API routes
export const config = {
  matcher: "/:path*",
};
