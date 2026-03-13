import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Eval",
  description: "High-Fidelity Observatory for RAG Diagnostics",
  icons: {
    icon: "/cts.png",
    shortcut: "/cts.png",
    apple: "/cts.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
