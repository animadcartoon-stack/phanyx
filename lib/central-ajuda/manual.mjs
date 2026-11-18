import manual from './manual.json' with { type: 'json' };
import copy from './manual-ui.json' with { type: 'json' };

export const manualGuides = manual;
export const moduleIds = [
  'setup', 'academic', 'teaching', 'external', 'documents', 'communication',
  'finance', 'hr', 'library', 'mobility', 'commercial', 'integrations', 'account',
  'teacher-work', 'student-work'
];

export const manualLabels = locale => Object.fromEntries(
  Object.entries(copy).map(([key, values]) => [key, values[locale]])
);

export function guideSlug(title) {
  return title.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function manualArticles(locale) {
  return Object.fromEntries(manual.map(guide => {
    const text = guide.translations[locale];
    return [guide.id, {
      ...text,
      id: guide.id,
      role: guide.role,
      group: guide.group,
      nativePath: guide.route,
      path: text.title,
      note: text.check,
      manual: true,
      detail: guide.detail
    }];
  }));
}
