"use client";

import { Button } from "@/components/ui";

export function RetryButton() {
  return (
    <Button variant="lime" size="lg" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}
