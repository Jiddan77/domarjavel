import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dommarjävel",
  description: "Allsvensk domarstatistik - Analys av domare i Allsvenskan",
  keywords: ["fotboll", "allsvenskan", "domare", "statistik", "kort", "straff"],
  authors: [{ name: "Dommarjävel Team" }],
  openGraph: {
    title: "Dommarjävel",
    description: "Allsvensk domarstatistik",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
