"use client";

import { useTranslations } from "next-intl";
import {
  PASSWORD_MIN_LENGTH,
  evaluatePassword,
} from "@/lib/password-policy";

type Props = {
  password: string;
  variant?: "light" | "dark";
};

export default function PasswordStrength({
  password,
  variant = "light",
}: Props) {
  const t = useTranslations(
    "PublicLogin.passwordSecurity"
  );

  const result =
    evaluatePassword(password);

  const config = {
    weak: {
      label: t("weak"),
      width: "w-1/3",
      bar: "bg-red-500",
      text:
        variant === "dark"
          ? "text-red-400"
          : "text-red-600",
    },
    medium: {
      label: t("medium"),
      width: "w-2/3",
      bar: "bg-amber-500",
      text:
        variant === "dark"
          ? "text-amber-400"
          : "text-amber-600",
    },
    strong: {
      label: t("strong"),
      width: "w-full",
      bar: "bg-emerald-500",
      text:
        variant === "dark"
          ? "text-emerald-400"
          : "text-emerald-600",
    },
  } as const;

  const current =
    config[result.strength];

  const rules = [
    {
      ok: result.minimumLength,
      label: t("minLength", {
        count: PASSWORD_MIN_LENGTH,
      }),
    },
    {
      ok: result.lowercase,
      label: t("lowercase"),
    },
    {
      ok: result.uppercase,
      label: t("uppercase"),
    },
    {
      ok: result.number,
      label: t("number"),
    },
    {
      ok: result.special,
      label: t("special"),
    },
  ];

  const containerClass =
    variant === "dark"
      ? "border-slate-700 bg-slate-950/70"
      : "border-slate-200 bg-slate-50";

  const labelClass =
    variant === "dark"
      ? "text-slate-200"
      : "text-slate-700";

  const emptyClass =
    variant === "dark"
      ? "text-slate-500"
      : "text-slate-400";

  const trackClass =
    variant === "dark"
      ? "bg-slate-700"
      : "bg-slate-200";

  const inactiveRuleClass =
    variant === "dark"
      ? "text-slate-400"
      : "text-slate-500";

  const noteClass =
    variant === "dark"
      ? "text-slate-400"
      : "text-slate-500";

  return (
    <div
      className={
        "space-y-3 rounded-2xl border p-4 text-sm " +
        containerClass
      }
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={
            "font-medium " + labelClass
          }
        >
          {t("strengthLabel")}
        </span>

        <span
          className={
            password
              ? "font-semibold " +
                current.text
              : emptyClass
          }
        >
          {password
            ? current.label
            : "\u2014"}
        </span>
      </div>

      <div
        className={
          "h-2 overflow-hidden rounded-full " +
          trackClass
        }
      >
        {password ? (
          <div
            className={
              "h-full rounded-full transition-all " +
              current.width +
              " " +
              current.bar
            }
          />
        ) : null}
      </div>

      <div className="space-y-1.5">
        {rules.map((rule) => (
          <div
            key={rule.label}
            className={
              rule.ok
                ? "flex items-center gap-2 text-emerald-500"
                : "flex items-center gap-2 " +
                  inactiveRuleClass
            }
          >
            <span aria-hidden="true">
              {rule.ok
                ? "\u2713"
                : "\u25cb"}
            </span>

            <span>{rule.label}</span>
          </div>
        ))}
      </div>

      <p
        className={
          "text-xs leading-5 " +
          noteClass
        }
      >
        {t("browserSuggestion")}
      </p>
    </div>
  );
}
