import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "@hilonova/ui/tokens.css";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hilonova — Patronaje digital para maquila",
  description:
    "Del patrón al corte, sin fricción. Diseña, gradúa y traza tus patrones desde el navegador y exporta PDF, SVG o DXF.",
};

// Inyectamos el basePath en una variable CSS para que la .brand .mk pueda
// usarlo como background-image: var(--brand-mark). CSS no lee env; HTML/JSX sí.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${jakarta.variable} ${plexMono.variable}`}
      style={{ ["--brand-mark" as string]: `url("${BASE}/brand/logo-oficial.webp")` }}
    >
      <body>{children}</body>
    </html>
  );
}
