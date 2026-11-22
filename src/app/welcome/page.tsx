import type { Metadata } from "next";
import { WelcomeClient } from "./welcome-client";

export const metadata: Metadata = { title: "Welcome to shiftly" };

export default function WelcomePage() {
  return <WelcomeClient />;
}
