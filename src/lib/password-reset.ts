/**
 * Password-reset rules shared by the backend and the mock. See docs/contract-auto-habits.md.
 * Pure TypeScript: no React, Next or server imports.
 */

/** Digits in the emailed code. */
export const RESET_CODE_LENGTH = 6;
/** The code stops working this many minutes after it was sent. */
export const RESET_CODE_TTL_MINUTES = 15;
/** Wrong guesses allowed per code; the 5th wrong guess burns it. */
export const RESET_MAX_ATTEMPTS = 5;
/** Codes that may be requested per email per rolling hour. */
export const RESET_MAX_REQUESTS_PER_HOUR = 3;
/** Minimum new password length (same rule as registration). */
export const RESET_MIN_PASSWORD_LENGTH = 8;
/** In mock mode every code is this value. Never used by real implementations. */
export const MOCK_RESET_CODE = "123456";
