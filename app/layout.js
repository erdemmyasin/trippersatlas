import "./globals.css";

export const metadata = {
  title: "TripperAtlas — Premium AI Travel Concierge",
  description: "Your premium AI-powered travel planning companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
