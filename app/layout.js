import "./globals.css";
import { headers, cookies } from "next/headers";
import AppProviders from "@/components/AppProviders";
import { getRequestRegion } from "@/lib/requestRegion";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

/** UI/Body — Plus Jakarta Sans (tüm metin, butonlar, formlar) */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Display / başlıklar — Fraunces (H1–H2, hero, quote, italic) */
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Atlas — Yapay Zeka Destekli Seyahat Planlama",
  description:
    "Atlas ile dünya genelinde otel, uçuş, araç ve rota planlayın. Yapay zeka seyahat asistanınız; Türkiye ve yurtdışı destinasyonlarda yanınızda.",
  keywords:
    "Atlas, seyahat planlama, yapay zeka, dünya tatili, otel, uçuş, araç kiralama, transfer, tur",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Atlas — Yapay Zeka Destekli Seyahat Planlama",
    description:
      "Atlas: yapay zeka ile küresel seyahat planlama — konaklama, ulaşım ve deneyimleri tek yerden yönetin.",
    type: "website",
  },
};

export default async function RootLayout({ children }) {
  const hdrs = await headers();
  const cks = await cookies();
  const region = getRequestRegion(hdrs, cks);
  const htmlLang = region.lang === 'EN' ? 'en' : 'tr';
  return (
    <html
      lang={htmlLang}
      className={`${fraunces.variable} ${plusJakarta.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
      </head>
      <body>
        <AppProviders initialLang={region.lang} initialRegion={region}>{children}</AppProviders>
      </body>
    </html>
  );
}
