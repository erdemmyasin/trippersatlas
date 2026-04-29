import "./globals.css";
import AppProviders from "@/components/AppProviders";
import { Fraunces, JetBrains_Mono } from "next/font/google";

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

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
