import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Neurosci AI | Neural Behavior Analysis Platform',
  description: 'Advanced AI platform for analyzing animal behavior and neural data. Streamline your neuroscience research with automated analysis tools.',
  icons: {
    icon: '/brain-emoji.svg',
  },
  openGraph: {
    title: 'Neurosci AI | Neural Behavior Analysis Platform',
    description: 'Advanced AI platform for analyzing animal behavior and neural data. Streamline your neuroscience research with automated analysis tools.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neurosci AI | Neural Behavior Analysis Platform',
    description: 'Advanced AI platform for analyzing animal behavior and neural data',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Already handled by Next.js metadata */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
