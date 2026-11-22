# Scenarios Seed Extension

This directory allows Friend / content agents to supply scenario and boss persona seed data for Shiftly.

## Expected Interface

Create an `index.ts` file in this directory (`prisma/seed/scenarios/index.ts`) that exports a `seedScenarios` function:

```typescript
import { PrismaClient } from "../../../src/generated/prisma/client";

export async function seedScenarios(prisma: PrismaClient): Promise<void> {
  // 1. Look up existing categories by slug:
  //    - handling-complaints
  //    - customer-queries
  //    - difficult-customers
  //    - problem-solving
  //
  // 2. Upsert scenarios, steps, choices, and boss personas with deterministic IDs.
  //    The script must be IDEMPOTENT so running multiple times produces identical results.
}
```

## Contract Rules
1. **Idempotent**: All inserts must use deterministic IDs and `upsert` so re-running does not fail or duplicate rows.
2. **Categories already exist**: Do not recreate categories; look them up by `slug`.
3. **No direct connections outside the contract**: Rely only on the passed `prisma` client.
