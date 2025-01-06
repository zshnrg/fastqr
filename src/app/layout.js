import { Toaster } from "@/components/ui/sonner"

import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const metadata = {
  title: "Fast QR",
  description: "Scan QR codes quickly and easily"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <style>
          {`
            :root {
              ${geistSans.css}
              ${geistMono.css}
            }
          `}
        </style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
