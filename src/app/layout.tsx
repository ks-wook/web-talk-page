import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

import { GlobalModalProvider } from '@/components/modal/GlobalModalProvider';

export const metadata: Metadata = {
  title: "Web Talk",
  description: "Welcome to Web Talk - Your Ultimate Chat Platform!",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <GlobalModalProvider>
          {children}
        </GlobalModalProvider>
      </body>
    </html>
  );
}
