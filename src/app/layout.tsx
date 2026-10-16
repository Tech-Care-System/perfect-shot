import { RegisterSW } from "@/components/register-sw";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Perfect Shot",
  applicationName: "Perfect Shot",
  description: "AI-guided photography coaching for perfect poses",
  appleWebApp: { title: "Perfect Shot" },
  icons: { apple: "/icon-192.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
