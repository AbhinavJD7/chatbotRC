// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./global.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "chatrc",
  description: "RapidClaims Chatbot for website",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // For iOS safe areas
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
