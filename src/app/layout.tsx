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
  title: "BIMA DuctDesigner — Dust extraction layout planner",
  description:
    "Plan dust extraction systems in the browser: drag & drop pipes and fittings, get a live priced bill of materials, request a quote or share the design with any dealer.",
  keywords: ["dust extraction", "duct design", "woodworking", "configurator", "Späneabsaugung", "Rohrplaner"],
  // Favicon comes from the App Router file conventions:
  //   src/app/favicon.ico · src/app/icon.svg · src/app/apple-icon.png
  openGraph: {
    title: "BIMA DuctDesigner",
    description: "Drag & drop duct planner with live priced bill of materials",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
