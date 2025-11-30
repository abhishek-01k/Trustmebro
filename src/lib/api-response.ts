import { NextResponse } from 'next/server';

/**
 * Standard API error codes
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_BET_AMOUNT'
  | 'INVALID_GAME_MODE'
  | 'INVALID_INPUT'
  | 'GAME_NOT_ACTIVE'
  | 'GAME_NOT_FOUND'
  | 'ALREADY_CASHED_OUT'
  | 'CANNOT_CASH_OUT'
  | 'CONTRACT_PAUSED'
  | 'INTERNAL_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_TILE_INDEX'
  | 'GAME_ALREADY_OVER'
  | 'INVALID_STATUS'
  | 'TX_VERIFICATION_FAILED'
  | 'TX_FAILED'
  | 'CONTRACT_ERROR'
  | 'USER_NOT_FOUND';

/**
 * API success response type
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API error response type
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success API response
 * @param data - The response data
 * @param status - HTTP status code (default 200)
 * @returns NextResponse with success payload
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data } as ApiSuccessResponse<T>, { status });
}

/**
 * Create an error API response
 * @param code - Error code
 * @param message - Human-readable error message
 * @param status - HTTP status code (default 400)
 * @returns NextResponse with error payload
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } } as ApiErrorResponse,
    { status }
  );
}

/**
 * Type guard to parse and validate API response
 * @param response - Raw response object
 * @returns Typed API response
 */
export function parseApiResponse<T>(response: unknown): ApiResponse<T> {
  const resp = response as ApiResponse<T>;
  return resp;
}
