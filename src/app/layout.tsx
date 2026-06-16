import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stay Secure 360 - Practical Safety & Security Guides",
  description: "Practical digital guides, checklists, and resources to help people protect their homes, families, businesses, and everyday life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
