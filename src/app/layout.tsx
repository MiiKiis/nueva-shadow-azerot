import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./effects.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHADOW AZEROTH | Servidor Privado WoW 3.3.5a - Educativo",
  description: "Shadow Azeroth es un servidor privado WoW 3.3.5a creado con fines educativos. No está afiliado con Blizzard Entertainment. Experiencia blizzlike con comunidad activa. Únete al mejor servidor de Rasganorte.",
  keywords: "WoW, World of Warcraft, Shadow Azeroth, WotLK, 3.3.5a, Servidor Privado, MMORPG, Educativo, Blizzlike, Rasganorte, Horda, Alianza",
  authors: [{ name: "Shadow Azeroth Team" }],
  creator: "Shadow Azeroth Team",
  openGraph: {
    title: "SHADOW AZEROTH - Servidor WoW 3.3.5a Educativo",
    description: "Servidor privado WoW 3.3.5a con fines educativos. No afiliado con Blizzard Entertainment. Experiencia blizzlike genuina y comunidad activa.",
    type: "website",
    locale: "es_ES",
    siteName: "SHADOW AZEROTH",
    url: "https://shadowazeroth.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "SHADOW AZEROTH - Servidor Educativo WoW 3.3.5a",
    description: "Servidor privado no afiliado. Educativo y blizzlike. Únete a Rasganorte.",
    creator: "@shadowazeroth",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-grow overflow-hidden w-full max-w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
