import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePlaceholder } from "@/features/onboarding/HomePlaceholder";

describe("Home placeholder", () => {
  it("greets the user and offers a logout button", () => {
    render(
      <HomePlaceholder name="Aarohi Joshi" avatarKey="buddy-3" onLogout={async () => {}} />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /hi aarohi/i }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: "Aarohi Joshi" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /log out/i })).toBeTruthy();
  });
});
