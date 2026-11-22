export type PasswordStrength = {
  /** 0 = empty, 1 = too short, 2 = okay, 3 = strong */
  level: 0 | 1 | 2 | 3;
  text: string;
};

/** Cheap client-side hint. The real rule (>= 8 characters) lives on the server. */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { level: 0, text: "Use at least 8 characters." };
  }
  if (password.length < 8) {
    const left = 8 - password.length;
    return { level: 1, text: `${left} more character${left === 1 ? "" : "s"} to go.` };
  }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (password.length >= 12 || variety >= 3) {
    return { level: 3, text: "Strong password." };
  }
  return { level: 2, text: "Good. Add numbers or symbols to make it stronger." };
}
