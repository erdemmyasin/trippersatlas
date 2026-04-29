import "./globals.css";

export const metadata = {
  title: "TripperAtlas — Yapay Zeka Destekli Seyahat Planlama",
  description: "Türkiye'nin en akıllı seyahat planlama platformu. Yapay zeka destekli kişisel seyahat asistanınız ile otel, transfer, tur ve daha fazlasını kolayca planlayın.",
  keywords: "seyahat planlama, yapay zeka, Türkiye tatil, otel rezervasyon, transfer, tur",
  openGraph: {
    title: "TripperAtlas — Yapay Zeka Destekli Seyahat Planlama",
    description: "Türkiye'nin en akıllı seyahat planlama platformu.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
