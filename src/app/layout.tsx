import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BIMA DuctDesigner — Absauganlagen planen",
  description:
    "Absauganlagen direkt im Browser planen: Rohre und Formteile per Drag & Drop platzieren, live kalkulierte Stückliste erhalten, Angebot anfordern oder Plan mit jedem Händler teilen.",
  keywords: ["dust extraction", "duct design", "woodworking", "configurator", "Späneabsaugung", "Rohrplaner"],
  // Favicon comes from the App Router file conventions:
  //   src/app/favicon.ico · src/app/icon.svg · src/app/apple-icon.png
  openGraph: {
    title: "BIMA DuctDesigner",
    description: "Absauganlagen planen · visualisieren · konfigurieren — mit live kalkulierter Stückliste",
    siteName: "BIMA DuctDesigner",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
