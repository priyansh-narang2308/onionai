/**
 * Centralized error handling utility for OnionAI
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Channel/OAuth errors
  CHANNEL_NOT_FOUND: "CHANNEL_NOT_FOUND",
  OAUTH_FAILED: "OAUTH_FAILED",
  TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
  UNSUPPORTED_PLATFORM: "UNSUPPORTED_PLATFORM",

  // Post errors
  POST_NOT_FOUND: "POST_NOT_FOUND",
  POST_PUBLISH_FAILED: "POST_PUBLISH_FAILED",
  IMAGE_UPLOAD_FAILED: "IMAGE_UPLOAD_FAILED",
  POST_LIMIT_EXCEEDED: "POST_LIMIT_EXCEEDED",

  // Idea errors
  IDEA_NOT_FOUND: "IDEA_NOT_FOUND",
  IDEA_GENERATION_FAILED: "IDEA_GENERATION_FAILED",

  // AI errors
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  TRANSLATION_FAILED: "TRANSLATION_FAILED",

  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",

  // External API errors
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",

  // Generic
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export function createErrorResponse(
  error: Error | AppError,
  statusCode?: number,
) {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  const message = error.message || "An unexpected error occurred";
  return {
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message,
    statusCode: statusCode || 500,
    details:
      process.env.NODE_ENV === "development"
        ? { error: error.toString() }
        : undefined,
  };
}

export function handlePublishError(error: unknown, platform: string): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Extract meaningful error messages from platform APIs
    if (error.message.includes("Unsupported provider type")) {
      return `${platform} publishing is not yet available. Please try another platform.`;
    }
    if (error.message.includes("Missing provider type or access token")) {
      return `Channel token expired or invalid. Please reconnect your ${platform} account.`;
    }
    if (error.message.includes("Failed to fetch image")) {
      return `Failed to process image. Please check image URL and try again.`;
    }
    if (error.message.includes("Failed to publish")) {
      return `Failed to publish to ${platform}. Please try again later.`;
    }
    if (
      error.message.includes("Missing") ||
      error.message.includes("required")
    ) {
      return `Missing required information for ${platform}. Please check your account settings.`;
    }
    return error.message;
  }

  return `An error occurred while publishing to ${platform}. Please try again.`;
}
