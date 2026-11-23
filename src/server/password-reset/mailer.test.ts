import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

import nodemailer from "nodemailer";
import {
  sendResetCode,
  getMailerTransport,
  resetMailerTransportForTesting,
} from "./mailer";

describe("mailer", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    resetMailerTransportForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetMailerTransportForTesting();
  });

  it("throws clear error when GMAIL_USER is missing", () => {
    delete process.env.GMAIL_USER;
    process.env.GMAIL_APP_PASSWORD = "app-password";

    expect(() => getMailerTransport()).toThrow(
      /Missing email configuration: GMAIL_USER and GMAIL_APP_PASSWORD must be defined/,
    );
  });

  it("throws clear error when GMAIL_APP_PASSWORD is missing", () => {
    process.env.GMAIL_USER = "test@gmail.com";
    delete process.env.GMAIL_APP_PASSWORD;

    expect(() => getMailerTransport()).toThrow(
      /Missing email configuration: GMAIL_USER and GMAIL_APP_PASSWORD must be defined/,
    );
  });

  it("creates nodemailer transport lazily with Gmail service", () => {
    process.env.GMAIL_USER = "test@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "test-secret-password";

    const transport1 = getMailerTransport();
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: "test@gmail.com",
        pass: "test-secret-password",
      },
    });

    const transport2 = getMailerTransport();
    expect(transport1).toBe(transport2);
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
  });

  it("sends email with correct subject, 6-digit code, expiration, and instructions", async () => {
    process.env.GMAIL_USER = "mailer@shiftly.com";
    process.env.GMAIL_APP_PASSWORD = "secret-pass";
    mockSendMail.mockResolvedValueOnce({ messageId: "msg-123" });

    await sendResetCode("employee@shiftly.com", "492817");

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailOptions = mockSendMail.mock.calls[0]?.[0] as {
      to: string;
      from: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(mailOptions).toBeDefined();

    expect(mailOptions.to).toBe("employee@shiftly.com");
    expect(mailOptions.from).toBe("Shiftly <mailer@shiftly.com>");
    expect(mailOptions.subject).toBe("Your Shiftly reset code");
    expect(mailOptions.text).toContain("492817");
    expect(mailOptions.text).toContain("expires in 15 minutes");
    expect(mailOptions.text).toContain("ignore");
    expect(mailOptions.html).toContain("492817");
    expect(mailOptions.html).toContain("expires in 15 minutes");
    expect(mailOptions.html).toContain("ignore");
  });
});
