import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { QueryClientProviderComponent } from "./components/query-client-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chimeria - AI Chat",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <QueryClientProviderComponent>
        <body className={`${inter.variable} antialiased`}>{children}</body>
      </QueryClientProviderComponent>
    </html>
  );
}
