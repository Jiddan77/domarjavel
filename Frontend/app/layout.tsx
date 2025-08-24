import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dommarjävel",
  description: "Allsvensk domarstatistik",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
