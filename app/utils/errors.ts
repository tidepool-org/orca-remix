import { z } from 'zod';

/**
 * Custom error types for different scenarios
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodError(error: z.ZodError): string {
  if (!error.errors || error.errors.length === 0) {
    return 'Validation failed';
  }

  const firstError = error.errors[0];
  const path = firstError.path.join('.');
  return `${path ? `${path}: ` : ''}${firstError.message}`;
}

/**
 * Format Zod errors into field-specific errors for forms
 */
export function formatZodFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (field) {
      fieldErrors[field] = err.message;
    }
  });

  return fieldErrors;
}

/**
 * Extract user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return formatZodError(error);
  }

  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Create a Response with error data for loaders/actions.
 * Only passes through messages from known, user-safe error types.
 * Unknown errors get a generic message to avoid leaking internals.
 */
export function errorResponse(error: unknown, status?: number): Response {
  const isUserFacing =
    error instanceof APIError ||
    error instanceof ValidationError ||
    error instanceof z.ZodError;

  const message = isUserFacing
    ? getErrorMessage(error)
    : 'An unexpected error occurred';

  const responseStatus =
    status ?? (error instanceof APIError ? (error.status ?? 500) : 500);

  return Response.json(
    {
      error: message,
      ...(error instanceof z.ZodError && {
        fieldErrors: formatZodFieldErrors(error),
      }),
    },
    { status: responseStatus },
  );
}
