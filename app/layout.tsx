import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Docwise AI",
  description: "A server-side document Q&A app grounded in bundled PDFs and text files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
