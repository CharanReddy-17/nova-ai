import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cosmic Explorer AI – 3D Astronomy AI Platform",
  description:
    "Explore the universe with AI. Real-time NASA data, 3D space simulations, and an intelligent astronomy assistant.",
  keywords: ["astronomy", "NASA", "AI chatbot", "3D space", "planets", "cosmos"],
  authors: [{ name: "Cosmic Explorer AI" }],
  openGraph: {
    title: "Cosmic Explorer AI",
    description: "Your AI-powered gateway to the universe.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-space-950 text-white overflow-hidden`}>
        <AuthProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
