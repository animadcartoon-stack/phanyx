import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "title": "Editor estruturado do Histórico Acadêmico",
    "subtitle": "Edite o conteúdo dentro de cada seção. Os marcadores estruturais permanecem fixos para que o PHANYX saiba onde montar cabeçalho, dados, tabela, assinatura e rodapé.",
    "protectedStructure": "Estrutura protegida",
    "missingSections": "{count} seção(ões) ausente(s) será(ão) recomposta(s) ao editar.",
    "visualMapTitle": "Mapa visual do histórico",
    "visualMapHelp": "Use este mapa para entender onde cada campo será utilizado no documento final.",
    "restoreSection": "Restaurar seção",
    "suggestedVariables": "Variáveis sugeridas para esta seção",
    "insertVariable": "Inserir variável nesta seção",
    "advancedTitle": "Código avançado do histórico",
    "advancedHelp": "Use somente se precisar editar a estrutura manualmente. Preserve os marcadores entre colchetes.",
    "systemTableNotice": "A tabela curricular é montada pelo sistema a partir dos registros acadêmicos. Nesta etapa, preserve o marcador desta seção; a configuração detalhada de colunas será conectada ao gerador do histórico na etapa seguinte.",
    "systemFooterNotice": "Código de validação e elementos obrigatórios de autenticação continuam protegidos pelo sistema, mesmo que o texto do rodapé seja personalizado.",
    "sections": {
      "header": "Cabeçalho institucional",
      "title": "Título do documento",
      "student": "Dados do aluno",
      "enrollment": "Dados da matrícula / curso",
      "curriculum": "Componentes curriculares",
      "notes": "Observações e resumo acadêmico",
      "signature": "Assinatura institucional",
      "footer": "Rodapé e validação"
    },
    "help": {
      "header": "Defina os dados institucionais que devem aparecer no topo. A logo continua sendo inserida pelo sistema.",
      "title": "Edite o título principal do histórico. O título pode variar conforme a modalidade de ensino.",
      "student": "Monte as linhas de identificação do aluno e escolha quais variáveis devem aparecer.",
      "enrollment": "Monte os dados de curso, matrícula, polo, período, carga horária e progresso.",
      "curriculum": "Área reservada para a tabela acadêmica. O sistema preenche os vínculos, notas, frequência e situação com dados reais.",
      "notes": "Inclua observações acadêmicas, legenda, índices, totais e demais informações de fechamento.",
      "signature": "Defina o conteúdo textual da área de assinatura. A assinatura digital continua usando a configuração institucional.",
      "footer": "Defina o texto institucional do rodapé sem remover os elementos obrigatórios de validação."
    }
  },
  "pt-PT": {
    "title": "Editor estruturado do Histórico Académico",
    "subtitle": "Edite o conteúdo dentro de cada secção. Os marcadores estruturais permanecem fixos para que o PHANYX saiba onde montar cabeçalho, dados, tabela, assinatura e rodapé.",
    "protectedStructure": "Estrutura protegida",
    "missingSections": "{count} secção(ões) em falta será(ão) recomposta(s) ao editar.",
    "visualMapTitle": "Mapa visual do histórico",
    "visualMapHelp": "Use este mapa para compreender onde cada campo será utilizado no documento final.",
    "restoreSection": "Restaurar secção",
    "suggestedVariables": "Variáveis sugeridas para esta secção",
    "insertVariable": "Inserir variável nesta secção",
    "advancedTitle": "Código avançado do histórico",
    "advancedHelp": "Use apenas se precisar de editar a estrutura manualmente. Preserve os marcadores entre parênteses retos.",
    "systemTableNotice": "A tabela curricular é montada pelo sistema a partir dos registos académicos. Nesta etapa, preserve o marcador desta secção; a configuração detalhada de colunas será ligada ao gerador do histórico na etapa seguinte.",
    "systemFooterNotice": "O código de validação e os elementos obrigatórios de autenticação continuam protegidos pelo sistema, mesmo que o texto do rodapé seja personalizado.",
    "sections": {
      "header": "Cabeçalho institucional",
      "title": "Título do documento",
      "student": "Dados do aluno",
      "enrollment": "Dados da matrícula / curso",
      "curriculum": "Componentes curriculares",
      "notes": "Observações e resumo académico",
      "signature": "Assinatura institucional",
      "footer": "Rodapé e validação"
    },
    "help": {
      "header": "Defina os dados institucionais que devem aparecer no topo. O logótipo continua a ser inserido pelo sistema.",
      "title": "Edite o título principal do histórico. O título pode variar conforme a modalidade de ensino.",
      "student": "Monte as linhas de identificação do aluno e escolha quais variáveis devem aparecer.",
      "enrollment": "Monte os dados do curso, matrícula, polo, período, carga horária e progresso.",
      "curriculum": "Área reservada para a tabela académica. O sistema preenche vínculos, notas, frequência e situação com dados reais.",
      "notes": "Inclua observações académicas, legenda, índices, totais e demais informações de fecho.",
      "signature": "Defina o conteúdo textual da área de assinatura. A assinatura digital continua a usar a configuração institucional.",
      "footer": "Defina o texto institucional do rodapé sem remover os elementos obrigatórios de validação."
    }
  },
  "en-US": {
    "title": "Structured Academic Transcript Editor",
    "subtitle": "Edit the content inside each section. Structural markers stay fixed so PHANYX knows where to build the header, data blocks, table, signature and footer.",
    "protectedStructure": "Protected structure",
    "missingSections": "{count} missing section(s) will be restored when editing.",
    "visualMapTitle": "Transcript visual map",
    "visualMapHelp": "Use this map to understand where each field is used in the final document.",
    "restoreSection": "Restore section",
    "suggestedVariables": "Suggested variables for this section",
    "insertVariable": "Insert variable in this section",
    "advancedTitle": "Advanced transcript code",
    "advancedHelp": "Use only when you need to edit the structure manually. Keep the bracketed section markers.",
    "systemTableNotice": "The curriculum table is built by the system from academic records. At this stage, keep this section marker; detailed column configuration will be connected to the transcript generator in the next step.",
    "systemFooterNotice": "Validation codes and required authentication elements remain system-protected even when the footer text is customized.",
    "sections": {
      "header": "Institution header",
      "title": "Document title",
      "student": "Student information",
      "enrollment": "Enrollment / course information",
      "curriculum": "Curriculum components",
      "notes": "Notes and academic summary",
      "signature": "Institutional signature",
      "footer": "Footer and validation"
    },
    "help": {
      "header": "Choose the institutional information shown at the top. The logo is still inserted by the system.",
      "title": "Edit the main transcript title. It may vary by education level or program.",
      "student": "Build the student identification lines and choose which variables should appear.",
      "enrollment": "Build course, enrollment, campus, period, workload and progress information.",
      "curriculum": "Reserved area for the academic table. The system fills enrollments, grades, attendance and status from real data.",
      "notes": "Include academic notes, legends, indexes, totals and closing information.",
      "signature": "Define the text content of the signature area. The digital signature continues to use institutional settings.",
      "footer": "Customize the institutional footer text without removing required validation elements."
    }
  },
  "es-ES": {
    "title": "Editor estructurado del Historial Académico",
    "subtitle": "Edite el contenido dentro de cada sección. Los marcadores estructurales permanecen fijos para que PHANYX sepa dónde montar encabezado, datos, tabla, firma y pie de página.",
    "protectedStructure": "Estructura protegida",
    "missingSections": "{count} sección(es) faltante(s) se restaurará(n) al editar.",
    "visualMapTitle": "Mapa visual del historial",
    "visualMapHelp": "Use este mapa para entender dónde se utilizará cada campo en el documento final.",
    "restoreSection": "Restaurar sección",
    "suggestedVariables": "Variables sugeridas para esta sección",
    "insertVariable": "Insertar variable en esta sección",
    "advancedTitle": "Código avanzado del historial",
    "advancedHelp": "Úselo solo si necesita editar la estructura manualmente. Conserve los marcadores entre corchetes.",
    "systemTableNotice": "La tabla curricular es generada por el sistema a partir de los registros académicos. En esta etapa, conserve el marcador de esta sección; la configuración detallada de columnas se conectará al generador en el siguiente paso.",
    "systemFooterNotice": "El código de validación y los elementos obligatorios de autenticación siguen protegidos por el sistema aunque el texto del pie sea personalizado.",
    "sections": {
      "header": "Encabezado institucional",
      "title": "Título del documento",
      "student": "Datos del alumno",
      "enrollment": "Datos de matrícula / curso",
      "curriculum": "Componentes curriculares",
      "notes": "Observaciones y resumen académico",
      "signature": "Firma institucional",
      "footer": "Pie y validación"
    },
    "help": {
      "header": "Defina los datos institucionales que deben aparecer arriba. El logotipo sigue siendo insertado por el sistema.",
      "title": "Edite el título principal del historial. Puede variar según la modalidad educativa.",
      "student": "Configure las líneas de identificación del alumno y elija qué variables deben aparecer.",
      "enrollment": "Configure curso, matrícula, sede, período, carga horaria y progreso.",
      "curriculum": "Área reservada para la tabla académica. El sistema completa vínculos, notas, asistencia y situación con datos reales.",
      "notes": "Incluya observaciones académicas, leyenda, índices, totales y datos de cierre.",
      "signature": "Defina el contenido textual del área de firma. La firma digital sigue usando la configuración institucional.",
      "footer": "Personalice el texto institucional del pie sin quitar los elementos obligatorios de validación."
    }
  },
  "fr-FR": {
    "title": "Éditeur structuré du relevé académique",
    "subtitle": "Modifiez le contenu de chaque section. Les marqueurs structurels restent fixes afin que PHANYX sache où construire l'en-tête, les données, le tableau, la signature et le pied de page.",
    "protectedStructure": "Structure protégée",
    "missingSections": "{count} section(s) manquante(s) seront restaurée(s) lors de la modification.",
    "visualMapTitle": "Carte visuelle du relevé",
    "visualMapHelp": "Utilisez cette carte pour comprendre où chaque champ sera utilisé dans le document final.",
    "restoreSection": "Restaurer la section",
    "suggestedVariables": "Variables suggérées pour cette section",
    "insertVariable": "Insérer la variable dans cette section",
    "advancedTitle": "Code avancé du relevé",
    "advancedHelp": "À utiliser uniquement si vous devez modifier la structure manuellement. Conservez les marqueurs entre crochets.",
    "systemTableNotice": "Le tableau du cursus est construit par le système à partir des dossiers académiques. À cette étape, conservez le marqueur de cette section ; la configuration détaillée des colonnes sera reliée au générateur à l'étape suivante.",
    "systemFooterNotice": "Le code de validation et les éléments d'authentification obligatoires restent protégés par le système même si le texte du pied de page est personnalisé.",
    "sections": {
      "header": "En-tête de l'établissement",
      "title": "Titre du document",
      "student": "Informations de l'étudiant",
      "enrollment": "Inscription / formation",
      "curriculum": "Composantes du cursus",
      "notes": "Observations et synthèse académique",
      "signature": "Signature institutionnelle",
      "footer": "Pied de page et validation"
    },
    "help": {
      "header": "Définissez les informations institutionnelles affichées en haut. Le logo reste inséré par le système.",
      "title": "Modifiez le titre principal du relevé. Il peut varier selon le niveau ou le type de formation.",
      "student": "Composez les lignes d'identification de l'étudiant et choisissez les variables à afficher.",
      "enrollment": "Composez les données de formation, inscription, campus, période, volume horaire et progression.",
      "curriculum": "Zone réservée au tableau académique. Le système renseigne inscriptions, notes, assiduité et statut à partir des données réelles.",
      "notes": "Ajoutez observations académiques, légende, indices, totaux et informations de clôture.",
      "signature": "Définissez le contenu textuel de la zone de signature. La signature numérique continue d'utiliser les paramètres institutionnels.",
      "footer": "Personnalisez le texte institutionnel du pied de page sans supprimer les éléments de validation obligatoires."
    }
  }
};

const arquivos = {
  "pt-BR": path.join(process.cwd(), "messages", "pt-BR.json"),
  "pt-PT": path.join(process.cwd(), "messages", "pt-PT.json"),
  "en-US": path.join(process.cwd(), "messages", "en-US.json"),
  "es-ES": path.join(process.cwd(), "messages", "es-ES.json"),
  "fr-FR": path.join(process.cwd(), "messages", "fr-FR.json"),
};

for (const [locale, arquivo] of Object.entries(arquivos)) {
  const atual = JSON.parse(fs.readFileSync(arquivo, "utf8"));

  atual.AdminDocumentsTemplatesHistoryEditor =
    traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(atual, null, 2) + "\n",
    "utf8"
  );

  console.log(`OK: ${locale}`);
}

console.log(
  "Traduções do editor estruturado de Histórico Acadêmico adicionadas."
);
