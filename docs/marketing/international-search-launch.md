# PHANYX: international search launch draft

Status: ready for review; no Google Ads campaign has been published or charged.

## Landing pages and campaign groups

| Country | Language | Search intent | Landing page |
| --- | --- | --- | --- |
| United States | English | Academic management | `/en-US/academic-management` |
| United States | English | School management software | `/en-US/school-management-software` |
| United States | English | Learning management system | `/en-US/learning-management-system` |
| United States | English | Student success platform | `/en-US/student-success-platform` |
| Portugal | Portuguese | Gestão académica; gestão escolar; ensino online | `/pt-PT/gestao-academica`, `/pt-PT/software-gestao-escolar`, `/pt-PT/plataforma-ensino-online` |
| Spain | Spanish | Gestión académica; gestión escolar; educación online | `/es-ES/gestion-academica`, `/es-ES/software-gestion-escolar`, `/es-ES/plataforma-educacion-online` |
| France | French | Gestion académique; gestion scolaire; enseignement en ligne | `/fr-FR/gestion-academique`, `/fr-FR/logiciel-gestion-scolaire`, `/fr-FR/plateforme-enseignement-en-ligne` |

Each country should have its own Search campaign, location targeting, language settings, local ad text and budget. Start with a small set of intent-specific phrase and exact keywords that match the landing page. Review search terms and lead quality before expanding coverage. The student-success pages can be a separate group after academic and school-management traffic has been assessed.

## Conversion and billing gates

- Define a qualified lead conversion from a submitted contact request or a verified conversation. Treat a WhatsApp click as an engagement event, not a completed sale.
- Verify Google Ads and Analytics tags on the public marketing pages and test conversions before spending. The existing `GoogleAdsPHANYX` component fetches an institution-admin-only endpoint, so it does not establish public visitor conversion tracking for PHANYX campaigns.
- Agree daily budgets and the Google Ads account, review localized ad copy, and confirm which countries PHANYX can serve.
- The self-service Asaas checkout currently charges BRL. International price estimates and trials use a commercial proposal until local-currency billing is operational; ads should reflect that condition.

## Organic search review

Submit `https://phanyx.com.br/sitemap.xml` in Search Console, then inspect index coverage, canonical URLs and reciprocal `hreflang` links for the new pages. Each intent page answers a distinct institutional question and links to the plan and academic overview pages. Avoid generating near-duplicate pages for slight keyword variations.

References: [Google multilingual pages](https://developers.google.com/search/docs/specialty/international/localized-versions), [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [Google Ads location and language](https://support.google.com/google-ads/answer/1722072).
