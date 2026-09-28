import type { ForeignLocale } from "@/lib/localized-plans";

// Commercial prices by market. These are independent price lists, not live FX conversions.
// The international checkout is handled by a proposal until billing supports local currencies.
export type MarketCountry = "BR" | "US" | "PT" | "ES" | "FR";
export const marketCountries: MarketCountry[] = ["BR", "US", "PT", "ES", "FR"];

export const defaultMarketCountry: Record<ForeignLocale, MarketCountry> = {
  "en-US": "US", "pt-PT": "PT", "es-ES": "ES", "fr-FR": "FR",
};

export const marketPricing: Record<MarketCountry, {
  currency: "BRL" | "USD" | "EUR";
  base: readonly [number, number, number];
  student: readonly [number, number, number];
  extraUnit: readonly [number, number];
}> = {
  BR: { currency: "BRL", base: [49, 99, 199], student: [3, 5, 7], extraUnit: [49, 79] },
  US: { currency: "USD", base: [29, 59, 119], student: [1, 1.5, 2], extraUnit: [19, 29] },
  PT: { currency: "EUR", base: [25, 49, 99], student: [0.75, 1.25, 1.75], extraUnit: [15, 25] },
  ES: { currency: "EUR", base: [25, 49, 99], student: [0.75, 1.25, 1.75], extraUnit: [15, 25] },
  FR: { currency: "EUR", base: [25, 49, 99], student: [0.75, 1.25, 1.75], extraUnit: [15, 25] },
};
