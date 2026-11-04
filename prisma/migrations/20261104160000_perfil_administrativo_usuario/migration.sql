CREATE TABLE "PerfilAdministrativoUsuario" (
    "userId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "cargo" TEXT,
    "fotoPerfil" TEXT,
    CONSTRAINT "PerfilAdministrativoUsuario_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "PerfilAdministrativoUsuario_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
