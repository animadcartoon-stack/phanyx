import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Script from "next/script";

export default async function GoogleTagManagerInstituicao() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      instituicaoId: number;
    };

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: decoded.instituicaoId,
      },
      select: {
        googleTagManagerId: true,
        googleTagManagerAtivo: true,
      },
    });

    if (
      !instituicao?.googleTagManagerAtivo ||
      !instituicao.googleTagManagerId
    ) {
      return null;
    }

    return (
      <Script id="google-tag-manager-phanyx" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),
                dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${instituicao.googleTagManagerId}');
        `}
      </Script>
    );
  } catch {
    return null;
  }
}