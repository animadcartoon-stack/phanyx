$ErrorActionPreference = "Stop"

$arquivo =
  ".\app\api\admin\documentos\templates\preview-pdf-fiel\route.ts"

if (-not (Test-Path -LiteralPath $arquivo)) {
  throw "Arquivo não encontrado: $arquivo"
}

$backup =
  "$arquivo.antes-completar-aliases-preview-v2.bak"

Copy-Item `
  -LiteralPath $arquivo `
  -Destination $backup `
  -Force

Write-Host "Backup criado: $backup" -ForegroundColor Green

$utf8SemBom =
  New-Object System.Text.UTF8Encoding($false)

$caminho =
  (Resolve-Path -LiteralPath $arquivo).Path

$conteudo =
  [System.IO.File]::ReadAllText(
    $caminho,
    [System.Text.Encoding]::UTF8
  )

$precisaCursoNome =
  $conteudo -notmatch
  '(?m)^\s*cursoNome\s*:'

$precisaDisciplinasContratadas =
  $conteudo -notmatch
  '(?m)^\s*disciplinasContratadas\s*:'

if (
  -not $precisaCursoNome -and
  -not $precisaDisciplinasContratadas
) {
  Write-Host "OK: aliases da prévia fiel já existem." -ForegroundColor Yellow
  exit 0
}

$padraoAncora =
  '(?m)^(\s*)valorContrato\s*:'

$matches =
  [regex]::Matches(
    $conteudo,
    $padraoAncora
  )

if ($matches.Count -ne 1) {
  throw "Segurança: era esperado exatamente 1 campo valorContrato na prévia fiel, mas foram encontrados $($matches.Count). Nenhuma alteração foi gravada."
}

$match =
  $matches[0]

$indent =
  $match.Groups[1].Value

$linhas =
  New-Object System.Collections.Generic.List[string]

if ($precisaCursoNome) {
  $linhas.Add(
    $indent +
    'cursoNome: "Bacharel Livre em Teologia",'
  )
}

if ($precisaDisciplinasContratadas) {
  if ($linhas.Count -gt 0) {
    $linhas.Add("")
  }

  $linhas.Add(
    $indent +
    "disciplinasContratadas:"
  )

  $linhas.Add(
    $indent +
    '  "- Antigo Testamento A — 96h<br>" +'
  )

  $linhas.Add(
    $indent +
    '  "- Novo Testamento A — 96h<br>" +'
  )

  $linhas.Add(
    $indent +
    '  "- Teologia Bíblica — 64h",'
  )
}

$linhas.Add("")

$insercao =
  ($linhas -join "`r`n")

$novoConteudo =
  $conteudo.Insert(
    $match.Index,
    $insercao
  )

[System.IO.File]::WriteAllText(
  $caminho,
  $novoConteudo,
  $utf8SemBom
)

if ($precisaCursoNome) {
  Write-Host "OK: cursoNome adicionado à prévia fiel." -ForegroundColor Green
}

if ($precisaDisciplinasContratadas) {
  Write-Host "OK: disciplinasContratadas adicionada à prévia fiel." -ForegroundColor Green
}

Write-Host ""
Write-Host "Prévia fiel alinhada sem alterar a lógica das tags." -ForegroundColor Cyan
