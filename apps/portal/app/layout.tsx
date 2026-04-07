import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ivyhouse Portal",
  description: "Ivyhouse OP System portal shell for login and flow-based landing.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
