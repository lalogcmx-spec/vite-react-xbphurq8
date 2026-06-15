import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Providers from "@/components/providers/Providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rossy Gourmet — Cocina que enamora",
  description:
    "Lasañas artesanales, postres y platillos gourmet. Pedidos online, mostrador y domicilio en Coacalco y Tultitlán.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#B8933A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
