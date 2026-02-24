import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Index of /josephawallace.com/",
  description: "Personal blog of Joseph Wallace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
