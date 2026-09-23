import { useTranslations } from "next-intl";

export default function RHPage() {
  const t = useTranslations("AdminHRDashboard");

  const cards = [
    {
      title: t("cards.employees.title"),
      description: t("cards.employees.description"),
    },
    {
      title: t("cards.departments.title"),
      description: t("cards.departments.description"),
    },
    {
      title: t("cards.documents.title"),
      description: t("cards.documents.description"),
    },
    {
      title: t("cards.history.title"),
      description: t("cards.history.description"),
    },
  ];

  return (
    <div className="space-y-6 text-slate-950 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="font-semibold text-slate-950 dark:text-white">
              {card.title}
            </h3>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
