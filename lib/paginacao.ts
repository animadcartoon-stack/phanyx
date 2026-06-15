import { NextRequest } from "next/server";

export function getPaginacao(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const limitBruto = Number(searchParams.get("limit") || 20);
  const limit = Math.min(Math.max(limitBruto, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function respostaPaginada<T>({
  data,
  total,
  page,
  limit,
}: {
  data: T[];
  total: number;
  page: number;
  limit: number;
}) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}