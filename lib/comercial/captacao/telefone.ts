export function normalizarTelefoneBR(
    valor: unknown
) {
    let numeros =
        String(valor ?? "")
            .replace(/\D/g, "");

    /*
     * Aceita também número colado
     * com código do Brasil:
     *
     * +55 11 98765-4321
     */
    if (
        numeros.startsWith("55") &&
        (
            numeros.length === 12 ||
            numeros.length === 13
        )
    ) {
        numeros =
            numeros.slice(2);
    }

    /*
     * Telefone brasileiro:
     * DDD + número.
     *
     * 10 dígitos = fixo
     * 11 dígitos = celular
     */
    return numeros.slice(
        0,
        11
    );
}

export function formatarTelefoneBR(
    valor: unknown
) {
    const numeros =
        normalizarTelefoneBR(
            valor
        );

    if (!numeros) {
        return "";
    }

    if (
        numeros.length <= 2
    ) {
        return `(${numeros}`;
    }

    const ddd =
        numeros.slice(
            0,
            2
        );

    const numero =
        numeros.slice(2);

    if (
        numero.length <= 4
    ) {
        return `(${ddd}) ${numero}`;
    }

    /*
     * Enquanto ainda não sabemos
     * se será fixo ou celular,
     * apenas acompanhamos a digitação.
     */
    if (
        numeros.length <= 10
    ) {
        return `(${ddd}) ${numero.slice(
            0,
            4
        )}-${numero.slice(4)}`;
    }

    return `(${ddd}) ${numero.slice(
        0,
        5
    )}-${numero.slice(5)}`;
}

export function telefoneValidoBR(
    valor: unknown
) {
    const numeros =
        normalizarTelefoneBR(
            valor
        );

    if (
        numeros.length !== 10 &&
        numeros.length !== 11
    ) {
        return false;
    }

    /*
     * Evita valores obviamente
     * inválidos como 00000000000
     * ou 11111111111.
     */
    if (
        /^(\d)\1+$/.test(
            numeros
        )
    ) {
        return false;
    }

    /*
     * DDD não pode começar em zero.
     */
    if (
        numeros[0] === "0"
    ) {
        return false;
    }

    return true;
}