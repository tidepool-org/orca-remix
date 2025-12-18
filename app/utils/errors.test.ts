import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ValidationError,
  APIError,
  formatZodError,
  formatZodFieldErrors,
  getErrorMessage,
  errorResponse,
} from './errors';

describe('errors', () => {
  describe('ValidationError', () => {
    it('creates error with message', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBeUndefined();
    });

    it('creates error with message and field', () => {
      const error = new ValidationError('Email is required', 'email');

      expect(error.message).toBe('Email is required');
      expect(error.field).toBe('email');
    });

    it('is instanceof Error', () => {
      const error = new ValidationError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('APIError', () => {
    it('creates error with message only', () => {
      const error = new APIError('Server error');

      expect(error.message).toBe('Server error');
      expect(error.name).toBe('APIError');
      expect(error.status).toBeUndefined();
      expect(error.code).toBeUndefined();
    });

    it('creates error with message and status', () => {
      const error = new APIError('Not found', 404);

      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
    });

    it('creates error with message, status, and code', () => {
      const error = new APIError('Unauthorized', 401, 'AUTH_FAILED');

      expect(error.message).toBe('Unauthorized');
      expect(error.status).toBe(401);
      expect(error.code).toBe('AUTH_FAILED');
    });

    it('is instanceof Error', () => {
      const error = new APIError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
    });
  });

  describe('formatZodError', () => {
    it('returns default message for empty errors', () => {
      // Create a ZodError with empty errors array
      const zodError = new z.ZodError([]);

      expect(formatZodError(zodError)).toBe('Validation failed');
    });

    it('formats error with path', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const result = schema.safeParse({ email: 'invalid' });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toContain('email');
      }
    });

    it('formats error without path', () => {
      const schema = z.string().min(5);

      const result = schema.safeParse('ab');
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toContain('5');
      }
    });

    it('uses first error when multiple errors exist', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      const result = schema.safeParse({ email: 'invalid', name: 'a' });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        // Should contain the first error's path
        expect(formatted).toContain('email');
      }
    });

    it('handles nested path', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            age: z.number().min(0),
          }),
        }),
      });

      const result = schema.safeParse({ user: { profile: { age: -1 } } });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toContain('user.profile.age');
      }
    });
  });

  describe('formatZodFieldErrors', () => {
    it('returns empty object for no errors', () => {
      const zodError = new z.ZodError([]);

      expect(formatZodFieldErrors(zodError)).toEqual({});
    });

    it('maps errors to field names', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      const result = schema.safeParse({ email: 'invalid', name: 'a' });
      if (!result.success) {
        const fieldErrors = formatZodFieldErrors(result.error);

        expect(fieldErrors).toHaveProperty('email');
        expect(fieldErrors).toHaveProperty('name');
      }
    });

    it('handles nested paths', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      });

      const result = schema.safeParse({ user: { email: 'invalid' } });
      if (!result.success) {
        const fieldErrors = formatZodFieldErrors(result.error);

        expect(fieldErrors).toHaveProperty('user.email');
      }
    });
  });

  describe('getErrorMessage', () => {
    it('extracts message from ZodError', () => {
      const schema = z.string().email();
      const result = schema.safeParse('invalid');

      if (!result.success) {
        const message = getErrorMessage(result.error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      }
    });

    it('extracts message from APIError', () => {
      const error = new APIError('API failed', 500);
      const message = getErrorMessage(error);

      expect(message).toBe('API failed');
    });

    it('extracts message from standard Error', () => {
      const error = new Error('Something went wrong');
      const message = getErrorMessage(error);

      expect(message).toBe('Something went wrong');
    });

    it('returns string directly if error is string', () => {
      const message = getErrorMessage('Direct error message');

      expect(message).toBe('Direct error message');
    });

    it('returns default message for unknown error types', () => {
      const message1 = getErrorMessage(null);
      const message2 = getErrorMessage(undefined);
      const message3 = getErrorMessage(42);
      const message4 = getErrorMessage({ unexpected: 'object' });

      expect(message1).toBe('An unexpected error occurred');
      expect(message2).toBe('An unexpected error occurred');
      expect(message3).toBe('An unexpected error occurred');
      expect(message4).toBe('An unexpected error occurred');
    });

    it('extracts message from ValidationError', () => {
      const error = new ValidationError('Field is required', 'fieldName');
      const message = getErrorMessage(error);

      expect(message).toBe('Field is required');
    });
  });

  describe('errorResponse', () => {
    it('creates Response with error message and default 400 status', async () => {
      const error = new Error('Bad request');
      const response = errorResponse(error);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Bad request');
    });

    it('creates Response with custom status', async () => {
      const error = new APIError('Not found', 404);
      const response = errorResponse(error, 404);

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe('Not found');
    });

    it('includes fieldErrors for ZodError', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const result = schema.safeParse({ email: 'bad', password: 'short' });
      if (!result.success) {
        const response = errorResponse(result.error, 422);

        expect(response.status).toBe(422);

        const body = await response.json();
        expect(body.error).toBeTruthy();
        expect(body.fieldErrors).toBeDefined();
        expect(body.fieldErrors).toHaveProperty('email');
        expect(body.fieldErrors).toHaveProperty('password');
      }
    });

    it('handles string errors', async () => {
      const response = errorResponse('Simple error message');

      const body = await response.json();
      expect(body.error).toBe('Simple error message');
    });

    it('handles unknown error types', async () => {
      const response = errorResponse({ weird: 'object' });

      const body = await response.json();
      expect(body.error).toBe('An unexpected error occurred');
    });
  });
});
