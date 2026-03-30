import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { SWRProvider } from "@/components/swr-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketOps — Centro de Operaciones",
  description: "Sistema de gestión de tickets de soporte técnico",
  manifest: "/manifest.json",
  themeColor: "#b4f636",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TicketOps",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRProvider>
          {children}
        </SWRProvider>
        <ToastProvider />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
