# Password Reset Backend

Production backend implementation for Shiftly's forgot-password flow via Gmail SMTP email codes.

## Files
- `mailer.ts`: Lazy Gmail SMTP transport (`nodemailer`) using `GMAIL_USER` and `GMAIL_APP_PASSWORD`. Sends a clean plain-text + HTML email with the 6-digit code.
- `repository.ts`: `realPasswordResetRepo` implementing `PasswordResetRepository` (`requestCode`, `verifyAndReset`).
- `mailer.test.ts`: Unit tests for lazy initialization and email formatting.
- `repository.test.ts`: Complete test suite covering all contract rules and edge cases.

## Security & Implementation Rules
1. **Code Generation & Hashing**:
   - 6 random digits generated with `crypto.randomInt`.
   - Stored hashed in PostgreSQL (`PasswordResetCode.codeHash`) with bcrypt (cost 10). Plain-text codes are never stored or logged.
2. **TTL & Attempts**:
   - Codes expire after 15 minutes (`RESET_CODE_TTL_MINUTES = 15`).
   - Max 5 wrong guesses per code (`RESET_MAX_ATTEMPTS = 5`). The 5th wrong attempt permanently burns the code (`too-many-tries`).
   - Wrong-attempt counting is atomic in PostgreSQL (`attempts: { increment: 1 }`).
3. **Rate Limiting**:
   - Max 3 code requests per email per rolling hour (`RESET_MAX_REQUESTS_PER_HOUR = 3`).
   - Applies identically to known and unknown emails via ghost rows.
4. **Account Privacy & Timing**:
   - `requestCode` always returns `{ ok: true }` for any well-formed email.
   - Known and unknown user flows return in similar time: emails are dispatched asynchronously using `after()` from `next/server` (with fallback to an un-awaited promise with error logging outside request scope).
   - Any mail delivery failure is caught and logged generically, never revealing whether an account exists, and never leaking codes or credentials.
   - For unknown emails, a ghost row (`userId = null`, `usedAt = now`) is created and dummy bcrypt hashing is performed to ensure consistent response timing and rate limiting without leaking account existence.
   - `verifyAndReset` against unknown emails performs dummy bcrypt comparison before returning `{ ok: false, reason: "invalid", field: "code" }`.
5. **Single Use & Invalidation**:
   - Requesting a new code marks earlier unused codes for that user as used.
   - Successful password reset updates the user's password hash and marks all codes for that user as used in a single database transaction (`db.$transaction`).
6. **Password Validation**:
   - Reuses the existing password validation rule from `registerSchema.shape.password` (`src/server/auth/validation.ts`, min 8 characters), hashed with bcrypt (cost 10).
