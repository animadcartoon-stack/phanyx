$ErrorActionPreference = "Stop"

$arquivos = @(
  ".\app\api\admin\documentos\gerar\route.ts",
  ".\app\api\admin\documentos\templates\route.ts",
  ".\app\api\admin\documentos\templates\preview-pdf-fiel\route.ts"
)

foreach ($arquivo in $arquivos) {
  if (-not (Test-Path -LiteralPath $arquivo)) {
    throw "Arquivo não encontrado: $arquivo"
  }

  Copy-Item `
    -LiteralPath $arquivo `
    -Destination "$arquivo.antes-alinhamento-tags-basicas.bak" `
    -Force
}

Write-Host "Backups desta etapa criados." -ForegroundColor Green

$utf8SemBom = New-Object System.Text.UTF8Encoding($false)

function Ler([string]$arquivo) {
  return [System.IO.File]::ReadAllText(
    (Resolve-Path -LiteralPath $arquivo).Path,
    [System.Text.Encoding]::UTF8
  )
}

function Gravar([string]$arquivo, [string]$conteudo) {
  [System.IO.File]::WriteAllText(
    (Resolve-Path -LiteralPath $arquivo).Path,
    $conteudo,
    $utf8SemBom
  )
}

# ============================================================
# 1) Marcar como automáticas SOMENTE tags de RH que o gerador
#    definitivo JÁ preenche hoje com dados reais.
# ============================================================

$arquivoTemplates =
  ".\app\api\admin\documentos\templates\route.ts"

$conteudo = Ler $arquivoTemplates

$tagsRhJaResolvidas = @(
  "nomeFuncionario",
  "funcionarioNome",
  "cpfFuncionario",
  "funcionarioCpf",
  "rgFuncionario",
  "funcionarioRg",
  "telefoneFuncionario",
  "emailFuncionario",
  "codigoFuncionario",
  "pisPasepFuncionario",
  "cargoFuncionario",
  "funcionarioCargo",
  "departamentoFuncionario",
  "funcionarioDepartamento",
  "dataAdmissaoFuncionario",
  "funcionarioDataAdmissao",
  "tipoContratoFuncionario",
  "cargaHorariaMensalFuncionario",
  "salarioBaseFuncionario",
  "funcionarioSalario",
  "statusFuncionario",
  "jornadaTrabalhoFuncionario",
  "nomeProfessor"
)

$padraoSet =
  '(?s)(const TAGS_AUTOMATICAS_DOCUMENTO = new Set\(\[\s*)(.*?)(\s*\]\);)'

$match =
  [regex]::Match(
    $conteudo,
    $padraoSet
  )

if (-not $match.Success) {
  throw "Não foi possível localizar TAGS_AUTOMATICAS_DOCUMENTO."
}

$miolo = $match.Groups[2].Value
$linhasAdicionar = New-Object System.Collections.Generic.List[string]

foreach ($tag in $tagsRhJaResolvidas) {
  if ($miolo -notmatch ('"' + [regex]::Escape($tag) + '"')) {
    $linhasAdicionar.Add("  `"$tag`",")
  }
}

if ($linhasAdicionar.Count -gt 0) {
  $blocoAdicionar =
    "`r`n`r`n  // RH - dados cadastrais já resolvidos automaticamente`r`n" +
    ($linhasAdicionar -join "`r`n")

  $novoMiolo =
    $miolo.TrimEnd() +
    $blocoAdicionar

  $novoBloco =
    $match.Groups[1].Value +
    $novoMiolo +
    $match.Groups[3].Value

  $conteudo =
    $conteudo.Substring(0, $match.Index) +
    $novoBloco +
    $conteudo.Substring(
      $match.Index + $match.Length
    )

  Gravar $arquivoTemplates $conteudo

  Write-Host `
    "OK: tags cadastrais de RH já resolvidas foram marcadas como automáticas." `
    -ForegroundColor Green
}
else {
  Write-Host `
    "OK: tags cadastrais de RH já estavam marcadas como automáticas." `
    -ForegroundColor Yellow
}

# ============================================================
# 2) Corrigir dois aliases acadêmicos que já constam como
#    automáticos no catálogo: cursoNome e disciplinasContratadas.
#    Nenhuma tag existente muda de comportamento.
# ============================================================

$arquivoGerar =
  ".\app\api\admin\documentos\gerar\route.ts"

$conteudo = Ler $arquivoGerar

if (
  $conteudo -match
  'valoresTemplate\.cursoNome\s*='
) {
  Write-Host `
    "OK: alias cursoNome já existe no gerador." `
    -ForegroundColor Yellow
}
else {
  $padrao =
    '(?m)^(\s*)const conteudoFinal\s*='

  $match =
    [regex]::Match(
      $conteudo,
      $padrao
    )

  if (-not $match.Success) {
    throw "Não foi possível localizar const conteudoFinal no gerador."
  }

  $indent = $match.Groups[1].Value

  $insercao = @"
${indent}valoresTemplate.cursoNome =
${indent}  valoresTemplate.curso;

${indent}valoresTemplate.disciplinasContratadas =
${indent}  valoresTemplate.disciplinas;

"@

  $conteudo =
    $conteudo.Insert(
      $match.Index,
      $insercao
    )

  Gravar $arquivoGerar $conteudo

  Write-Host `
    "OK: cursoNome e disciplinasContratadas agora usam os mesmos dados reais de curso e disciplinas." `
    -ForegroundColor Green
}

# ============================================================
# 3) Fazer a PRÉVIA FIEL reconhecer os mesmos dois aliases.
#    Aqui continuam sendo exemplos, porque é prévia de template.
# ============================================================

$arquivoPreview =
  ".\app\api\admin\documentos\templates\preview-pdf-fiel\route.ts"

$conteudo = Ler $arquivoPreview

if ($conteudo -notmatch '(?m)^\s*cursoNome\s*:') {
  $padrao =
    '(?m)^(\s*)curso:\s*"Bacharel Livre em Teologia",\s*$'

  $match =
    [regex]::Match(
      $conteudo,
      $padrao
    )

  if (-not $match.Success) {
    throw "Não foi possível localizar o exemplo da tag curso na prévia fiel."
  }

  $linha = $match.Value
  $indent = $match.Groups[1].Value

  $substituicao =
    $linha +
    "`r`n" +
    $indent +
    'cursoNome: "Bacharel Livre em Teologia",'

  $conteudo =
    $conteudo.Substring(0, $match.Index) +
    $substituicao +
    $conteudo.Substring(
      $match.Index + $match.Length
    )

  Write-Host `
    "OK: cursoNome adicionado à prévia fiel." `
    -ForegroundColor Green
}
else {
  Write-Host `
    "OK: cursoNome já existia na prévia fiel." `
    -ForegroundColor Yellow
}

if ($conteudo -notmatch '(?m)^\s*disciplinasContratadas\s*:') {
  $padrao =
    '(?ms)^(\s*)disciplinas:\s*\r?\n\s*"- Antigo Testamento A — 96h<br>" \+\s*\r?\n\s*"- Novo Testamento A — 96h<br>" \+\s*\r?\n\s*"- Teologia Bíblica — 64h",'

  $match =
    [regex]::Match(
      $conteudo,
      $padrao
    )

  if (-not $match.Success) {
    throw "Não foi possível localizar o exemplo de disciplinas na prévia fiel."
  }

  $indent = $match.Groups[1].Value

  $substituicao =
    $match.Value +
    "`r`n`r`n" +
    $indent +
    "disciplinasContratadas:`r`n" +
    $indent +
    '  "- Antigo Testamento A — 96h<br>" +' +
    "`r`n" +
    $indent +
    '  "- Novo Testamento A — 96h<br>" +' +
    "`r`n" +
    $indent +
    '  "- Teologia Bíblica — 64h",'

  $conteudo =
    $conteudo.Substring(0, $match.Index) +
    $substituicao +
    $conteudo.Substring(
      $match.Index + $match.Length
    )

  Write-Host `
    "OK: disciplinasContratadas adicionada à prévia fiel." `
    -ForegroundColor Green
}
else {
  Write-Host `
    "OK: disciplinasContratadas já existia na prévia fiel." `
    -ForegroundColor Yellow
}

Gravar $arquivoPreview $conteudo

Write-Host ""
Write-Host "Alinhamento seguro das tags básicas concluído." -ForegroundColor Cyan
Write-Host "Nenhuma regra de férias, holerite, rescisão, ASO ou afastamento foi alterada." -ForegroundColor Cyan
