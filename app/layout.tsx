import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Read. Return. Review. — ENLIT",
  description: "Choose an ENLIT book, borrow it free for 30 days, and pass the story forward with a review reel.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
