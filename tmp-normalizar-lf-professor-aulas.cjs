const fs = require("fs");

const path = "app/professor/aulas/page.tsx";

let s = fs.readFileSync(path, "utf8");

// Normaliza CRLF, CRCRLF e CR isolado para LF
s = s.replace(/\r+\n/g, "\n");
s = s.replace(/\r/g, "\n");

fs.writeFileSync(path, s, "utf8");

console.log("OK: finais de linha normalizados para LF.");
