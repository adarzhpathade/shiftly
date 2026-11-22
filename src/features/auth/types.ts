/** What a form submit callback reports back to the screen. */
export type FormResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type DemoAccount = {
  label: string;
  email: string;
  password: string;
};
