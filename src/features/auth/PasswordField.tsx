"use client";

import { useState } from "react";
import { TextField, type TextFieldProps } from "@/components/ui";

/** TextField with a show/hide toggle. */
export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="min-h-9 rounded-pill px-3 text-[13px] font-extrabold text-lav-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-lav-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}
