/**
 * Error handling utilities
 */

import { VercelResponse } from '@vercel/node';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public error: string = 'ApiError'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleError(res: VercelResponse, error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: error.error,
      message: error.message,
      status: error.status,
    });
  }

  return res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    status: 500,
  });
}

export function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return (
    !isNaN(parsed.getTime()) &&
    parsed.getFullYear() === y &&
    parsed.getMonth() === m - 1 &&
    parsed.getDate() === d
  );
}
