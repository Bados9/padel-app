import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Anton } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-ui",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const anton = Anton({
  variable: "--font-display-ui",
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hraj:Padel – rezervační systém",
  description: "Rezervace padelových kurtů a hledání spoluhráčů",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${jetbrains.variable} ${anton.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
