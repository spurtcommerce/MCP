import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Spurtcommerce Assistant",
  description: "An AI-powered chatbot that helps you browse products, check availability, and explore categories in your Spurtcommerce store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.className} antialiased`}
      >
        {children}
      </body>

    </html>
  );
}
