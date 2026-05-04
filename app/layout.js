import "./globals.css";
import { headers, cookies } from "next/headers";
import AppProviders from "@/components/AppProviders";
import { getRequestRegion } from "@/lib/requestRegion";
import {
  Fraunces,
  JetBrains_Mono,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Landing hero başlığı — serif (scroll narrative) */
const playfairLanding = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair-landing",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Display / başlıklar — design tool: Fraunces (H1–H2, hero, quote) */
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

/** Fiyat, koordinat — design tool: JetBrains Mono 500 13px */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${plusJakarta.variable} ${playfairLanding.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body>
        <AppProviders initialLang={region.lang} initialRegion={region}>{children}</AppProviders>
      </body>
    </html>
  );
}
