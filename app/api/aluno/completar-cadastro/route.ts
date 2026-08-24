import { NextResponse } from "next/server";
import { getCountries, type CountryCode } from "libphonenumber-js";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  normalizarTelefoneE164,
  telefoneValidoInternacional,
} from "@/lib/internacionalizacao/telefone";

export const dynamic = "force-dynamic";

const PAISES = new Set<string>(getCountries());

function erro(code: string, message: string, status: number) {
  return NextResponse.json({ code, error: message }, { status });
}

function textoOpcional(valor: unknown, limite = 255) {
  const texto = String(valor ?? "").trim();
  return texto ? texto.slice(0, limite) : null;
}

function paisOpcional(valor: unknown): CountryCode | null {
  const codigo = String(valor ?? "").trim().toUpperCase();
  return PAISES.has(codigo) ? (codigo as CountryCode) : null;
}

function codigoPostalValido(valor: unknown, pais: CountryCode) {
  const texto = String(valor ?? "").trim();
  if (!texto) return true;

  const digitos = texto.replace(/\D/g, "");
  if (pais === "BR") return digitos.length === 8;
  if (pais === "PT") return digitos.length === 7;
  if (pais === "US") return digitos.length === 5 || digitos.length === 9;
  if (pais === "ES" || pais === "FR") return digitos.length === 5;

  const tamanho = texto.replace(/\s/g, "").length;
  return tamanho >= 3 && tamanho <= 16;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role || "").toUpperCase() !== "ALUNO") {
      return erro("FORBIDDEN", "Sem permissão", 403);
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return erro("STUDENT_NOT_FOUND", "Aluno não encontrado", 404);
    }

    return NextResponse.json(aluno);
  } catch (error) {
    console.error("ERRO AO BUSCAR CADASTRO DO ALUNO:", error);
    return erro("LOAD_FAILED", "Erro ao buscar cadastro", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role || "").toUpperCase() !== "ALUNO") {
      return erro("FORBIDDEN", "Sem permissão", 403);
    }

    const body = await req.json();
    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        cpf: true,
        rg: true,
        cpfResponsavel: true,
      },
    });

    if (!aluno) {
      return erro("STUDENT_NOT_FOUND", "Aluno não encontrado", 404);
    }

    const paisResidencia = paisOpcional(body.paisResidencia);
    const paisTelefone = paisOpcional(body.paisTelefone);
    const paisTelefoneResponsavel = paisOpcional(body.paisTelefoneResponsavel);
    const paisNascimento = body.paisNascimento
      ? paisOpcional(body.paisNascimento)
      : null;
    const tipoDocumento = textoOpcional(body.tipoDocumento, 50);
    const numeroDocumento = textoOpcional(body.numeroDocumento, 100);
    const telefone = textoOpcional(body.telefone, 40);

    if (!paisResidencia || !paisTelefone || (body.paisNascimento && !paisNascimento)) {
      return erro("INVALID_COUNTRY", "País inválido", 400);
    }

    if (!tipoDocumento || !numeroDocumento || !telefone || !body.dataNascimento) {
      return erro(
        "MISSING_REQUIRED_FIELDS",
        "Documento, telefone e data de nascimento são obrigatórios",
        400
      );
    }

    if (!telefoneValidoInternacional(telefone, paisTelefone)) {
      return erro("INVALID_PHONE", "Telefone inválido", 400);
    }

    const telefoneResponsavel = textoOpcional(body.telefoneResponsavel, 40);

    if (
      telefoneResponsavel &&
      (!paisTelefoneResponsavel ||
        !telefoneValidoInternacional(telefoneResponsavel, paisTelefoneResponsavel))
    ) {
      return erro("INVALID_GUARDIAN_PHONE", "Telefone do responsável inválido", 400);
    }

    if (!codigoPostalValido(body.cep, paisResidencia)) {
      return erro("INVALID_POSTAL_CODE", "Código postal inválido", 400);
    }

    const dataNascimento = new Date(String(body.dataNascimento));

    if (Number.isNaN(dataNascimento.getTime())) {
      return erro("INVALID_DATE", "Data de nascimento inválida", 400);
    }

    const tipoDocumentoNormalizado = tipoDocumento.toUpperCase();
    const tipoDocumentoResponsavel = textoOpcional(
      body.tipoDocumentoResponsavel,
      50
    );
    const numeroDocumentoResponsavel = textoOpcional(
      body.numeroDocumentoResponsavel,
      100
    );

    const atualizado = await prisma.aluno.update({
      where: { id: aluno.id },
      data: {
        nomeSocial: textoOpcional(body.nomeSocial),
        genero: textoOpcional(body.genero, 50),
        nacionalidade: textoOpcional(body.nacionalidade, 100),
        paisNascimento,
        paisResidencia,
        tipoDocumento: tipoDocumentoNormalizado,
        numeroDocumento,
        paisTelefone,
        cpf:
          tipoDocumentoNormalizado === "CPF"
            ? numeroDocumento
            : textoOpcional(body.cpf, 50) ?? aluno.cpf,
        rg:
          tipoDocumentoNormalizado === "RG"
            ? numeroDocumento
            : textoOpcional(body.rg, 50) ?? aluno.rg,
        telefone: normalizarTelefoneE164(telefone, paisTelefone),
        dataNascimento,
        cep: textoOpcional(body.cep, 20),
        endereco: textoOpcional(body.endereco),
        numero: textoOpcional(body.numero, 50),
        complemento: textoOpcional(body.complemento),
        bairro: textoOpcional(body.bairro),
        cidade: textoOpcional(body.cidade),
        estado: textoOpcional(body.estado),
        nomeResponsavel: textoOpcional(body.nomeResponsavel),
        tipoDocumentoResponsavel,
        numeroDocumentoResponsavel,
        paisTelefoneResponsavel: telefoneResponsavel
          ? paisTelefoneResponsavel
          : null,
        cpfResponsavel:
          tipoDocumentoResponsavel?.toUpperCase() === "CPF"
            ? numeroDocumentoResponsavel
            : textoOpcional(body.cpfResponsavel, 50) ?? aluno.cpfResponsavel,
        telefoneResponsavel:
          telefoneResponsavel && paisTelefoneResponsavel
            ? normalizarTelefoneE164(telefoneResponsavel, paisTelefoneResponsavel)
            : null,
        emailResponsavel: textoOpcional(body.emailResponsavel),
        parentescoResponsavel: textoOpcional(body.parentescoResponsavel, 100),
        possuiNecessidadeEspecial: Boolean(body.possuiNecessidadeEspecial),
        descricaoNecessidadeEspecial: textoOpcional(
          body.descricaoNecessidadeEspecial,
          2000
        ),
        observacoesAcessibilidade: textoOpcional(
          body.observacoesAcessibilidade,
          2000
        ),
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("ERRO AO ATUALIZAR CADASTRO DO ALUNO:", error);
    return erro("UPDATE_FAILED", "Erro ao atualizar cadastro", 500);
  }
}