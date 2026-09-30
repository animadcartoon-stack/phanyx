export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrength =
  | "weak"
  | "medium"
  | "strong";

export type PasswordEvaluation = {
  minimumLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
  valid: boolean;
  strength: PasswordStrength;
};

export function evaluatePassword(
  value: string
): PasswordEvaluation {
  const password = String(value || "");

  const minimumLength =
    password.length >= PASSWORD_MIN_LENGTH;

  const lowercase = /[a-z]/.test(password);
  const uppercase = /[A-Z]/.test(password);
  const number = /[0-9]/.test(password);
  const special =
    /[^A-Za-z0-9\s]/.test(password);

  const valid =
    minimumLength &&
    lowercase &&
    uppercase &&
    number &&
    special;

  const requisitosCumpridos = [
    minimumLength,
    lowercase,
    uppercase,
    number,
    special,
  ].filter(Boolean).length;

  let strength: PasswordStrength = "weak";

  if (
    valid &&
    password.length >= 12
  ) {
    strength = "strong";
  } else if (
    requisitosCumpridos >= 4
  ) {
    strength = "medium";
  }

  return {
    minimumLength,
    lowercase,
    uppercase,
    number,
    special,
    valid,
    strength,
  };
}

export function validatePassword(
  value: string
) {
  const evaluation =
    evaluatePassword(value);

  if (evaluation.valid) {
    return {
      ok: true as const,
    };
  }

  return {
    ok: false as const,
    error:
      "A senha deve ter pelo menos 8 caracteres, " +
      "incluindo letra mai?scula, letra min?scula, " +
      "n?mero e caractere especial.",
  };
}
