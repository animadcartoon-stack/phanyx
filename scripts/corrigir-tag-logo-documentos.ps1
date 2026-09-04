$ErrorActionPreference = "Stop"

$Utf8SemBom = New-Object System.Text.UTF8Encoding($false)

function Ler-Arquivo {
  param([Parameter(Mandatory = $true)][string]$Arquivo)

  if (-not (Test-Path -LiteralPath $Arquivo)) {
    throw "Arquivo não encontrado: $Arquivo"
  }

  $caminho = (Resolve-Path -LiteralPath $Arquivo).Path
  return [System.IO.File]::ReadAllText($caminho, [System.Text.Encoding]::UTF8)
}

function Gravar-Arquivo {
  param(
    [Parameter(Mandatory = $true)][string]$Arquivo,
    [Parameter(Mandatory = $true)][string]$Conteudo
  )

  $caminho = (Resolve-Path -LiteralPath $Arquivo).Path
  [System.IO.File]::WriteAllText($caminho, $Conteudo, $Utf8SemBom)
}

function Substituir-UmaVez {
  param(
    [Parameter(Mandatory = $true)][string]$Arquivo,
    [Parameter(Mandatory = $true)][string]$Padrao,
    [Parameter(Mandatory = $true)][string]$Substituicao,
    [Parameter(Mandatory = $true)][string]$Descricao
  )

  $conteudo = Ler-Arquivo $Arquivo

  $regex = New-Object System.Text.RegularExpressions.Regex(
    $Padrao,
    [System.Text.RegularExpressions.RegexOptions]::Multiline
  )

  $matches = $regex.Matches($conteudo)

  if ($matches.Count -eq 0) {
    throw "Trecho não encontrado em '$Arquivo': $Descricao. Nenhuma alteração foi feita nesse passo."
  }

  if ($matches.Count -gt 1) {
    throw "Segurança: foram encontrados $($matches.Count) trechos para '$Descricao' em '$Arquivo'. Operação interrompida."
  }

  $novoConteudo = $regex.Replace($conteudo, $Substituicao, 1)
  Gravar-Arquivo -Arquivo $Arquivo -Conteudo $novoConteudo

  Write-Host "OK: $Descricao" -ForegroundColor Green
}

$arquivoGerar = ".\app\api\admin\documentos\gerar\route.ts"
$arquivoPreviewFiel = ".\app\api\admin\documentos\templates\preview-pdf-fiel\route.ts"
$arquivoRenderizador = ".\lib\documentos\renderizador-template-documento.ts"

Write-Host ""
Write-Host "=== CORREÇÃO SEGURA DA TAG {{logoInstituicao}} ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 1) GERADOR DEFINITIVO
# ============================================================

$conteudo = Ler-Arquivo $arquivoGerar

if ($conteudo.Contains('const marcadorLogoInstituicao =')) {
  Write-Host "OK: marcador interno da logo já existe no gerador" -ForegroundColor Yellow
}
else {
  $replacement = @'
    const marcadorLogoInstituicao =
      "__PHANYX_LOGO_INSTITUICAO__";

    const marcadorAssinaturaDiretor =
'@

  Substituir-UmaVez `
    -Arquivo $arquivoGerar `
    -Padrao '(?m)^\s*const marcadorAssinaturaDiretor\s*=\s*$' `
    -Substituicao $replacement `
    -Descricao "criar marcador interno da logo no gerador"
}

$conteudo = Ler-Arquivo $arquivoGerar

if ($conteudo -match 'logoInstituicao\s*:\s*marcadorLogoInstituicao') {
  Write-Host "OK: logoInstituicao já está ligada ao marcador" -ForegroundColor Yellow
}
else {
  $replacement = @'
            logoInstituicao:
              marcadorLogoInstituicao,
'@

  Substituir-UmaVez `
    -Arquivo $arquivoGerar `
    -Padrao '(?m)^\s*logoInstituicao\s*:\s*""\s*,\s*$' `
    -Substituicao $replacement `
    -Descricao "ligar a tag logoInstituicao ao marcador real"
}

# ============================================================
# 2) PRÉVIA FIEL
# ============================================================

$conteudo = Ler-Arquivo $arquivoPreviewFiel

if ($conteudo.Contains('__PHANYX_LOGO_INSTITUICAO__')) {
  Write-Host "OK: prévia fiel já preserva a logo" -ForegroundColor Yellow
}
else {
  $replacement = @'
  const valores: Record<string, string> = {
    logoInstituicao:
      "__PHANYX_LOGO_INSTITUICAO__",
'@

  Substituir-UmaVez `
    -Arquivo $arquivoPreviewFiel `
    -Padrao '(?m)^\s*const valores:\s*Record<string,\s*string>\s*=\s*\{\s*$' `
    -Substituicao $replacement `
    -Descricao "preservar logoInstituicao na prévia fiel"
}

# ============================================================
# 3) RENDERIZADOR COMPARTILHADO
# ============================================================

$conteudo = Ler-Arquivo $arquivoRenderizador

if ($conteudo.Contains('function criarLogoInstituicaoDocumento')) {
  Write-Host "OK: função da logo já existe no renderizador" -ForegroundColor Yellow
}
else {
  $replacement = @'
function criarLogoInstituicaoDocumento({
  instituicao,
  modoPrevia,
}: {
  instituicao:
    DadosInstituicaoDocumento;

  modoPrevia: boolean;
}) {
  const logoUrl =
    String(
      instituicao.logoDataUri ||
      instituicao.logoUrl ||
      ""
    ).trim();

  if (!logoUrl) {
    if (!modoPrevia) {
      return "";
    }

    return `
      <span
        class="phanyx-logo-instituicao-placeholder"
      >
        Logo da instituição
      </span>
    `;
  }

  return `
    <span
      class="phanyx-logo-instituicao-inline"
    >
      <img
        src="${escaparHtml(
          logoUrl
        )}"
        alt="Logo da instituição"
      />
    </span>
  `;
}

export function aplicarLogoInstituicaoDocumento({
  conteudo,
  instituicao,
  modoPrevia = false,
}: {
  conteudo: string;

  instituicao:
    DadosInstituicaoDocumento;

  modoPrevia?: boolean;
}) {
  const logo =
    criarLogoInstituicaoDocumento({
      instituicao,
      modoPrevia,
    });

  return String(conteudo || "")
    .replaceAll(
      "__PHANYX_LOGO_INSTITUICAO__",
      logo
    )
    .replace(
      /{{\s*logoInstituicao\s*}}/gi,
      logo
    );
}

export function aplicarAssinaturasDocumento({
'@

  Substituir-UmaVez `
    -Arquivo $arquivoRenderizador `
    -Padrao '(?m)^export function aplicarAssinaturasDocumento\(\{\s*$' `
    -Substituicao $replacement `
    -Descricao "adicionar renderização da logo institucional"
}

$conteudo = Ler-Arquivo $arquivoRenderizador

if ($conteudo -match 'aplicarLogoInstituicaoDocumento\(\{') {
  Write-Host "OK: logo já faz parte do pipeline de renderização" -ForegroundColor Yellow
}
else {
  $replacement = @'
  conteudo =
    aplicarLogoInstituicaoDocumento({
      conteudo,

      instituicao:
        opcoes.instituicao,

      modoPrevia,
    });

  conteudo =
    aplicarAssinaturasDocumento({
'@

  Substituir-UmaVez `
    -Arquivo $arquivoRenderizador `
    -Padrao '(?ms)^\s*conteudo\s*=\s*\r?\n\s*aplicarAssinaturasDocumento\(\{\s*$' `
    -Substituicao $replacement `
    -Descricao "aplicar logo antes das assinaturas"
}

$conteudo = Ler-Arquivo $arquivoRenderizador

if ($conteudo.Contains('.phanyx-logo-instituicao-inline')) {
  Write-Host "OK: CSS isolado da logo já existe" -ForegroundColor Yellow
}
else {
  $replacement = @'
    .phanyx-logo-instituicao-inline {
      display: inline-block;
      max-width: 36mm;
      max-height: 24mm;
      margin: 0;
      padding: 0;
      vertical-align: middle;
      line-height: 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .phanyx-logo-instituicao-inline img {
      display: block;
      width: auto;
      height: auto;
      max-width: 36mm;
      max-height: 24mm;
      object-fit: contain;
    }

    .phanyx-logo-instituicao-placeholder {
      display: inline-flex;
      width: 36mm;
      height: 20mm;
      align-items: center;
      justify-content: center;
      border: 0.3mm dashed #94a3b8;
      color: #64748b;
      font-size: 7.5pt;
      line-height: 1.2;
      text-align: center;
      vertical-align: middle;
    }

    .phanyx-assinatura-imagem {
'@

  Substituir-UmaVez `
    -Arquivo $arquivoRenderizador `
    -Padrao '(?m)^\s*\.phanyx-assinatura-imagem\s*\{\s*$' `
    -Substituicao $replacement `
    -Descricao "adicionar CSS isolado da logo inserida por tag"
}

Write-Host ""
Write-Host "Correção da tag {{logoInstituicao}} concluída." -ForegroundColor Cyan
Write-Host "Nenhuma regra existente de assinatura foi alterada." -ForegroundColor Cyan
