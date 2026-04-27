import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plagcheck",
  description: "Anti-plagiarism and AI-detection SaaS foundation"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
