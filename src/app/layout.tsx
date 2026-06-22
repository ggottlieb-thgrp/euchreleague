import type { Metadata } from "next";
import { Open_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Museo Sans (brand heading face) is not on Google Fonts; Open Sans is the
// brand-sanctioned fallback. Source Serif Pro -> Source Serif 4 for body.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "THG Euchre League",
  description: "The Heritage Group euchre league — pairings, scores, standings, and scheduling.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-thg-mist text-thg-slate">
        {children}
      </body>
    </html>
  );
}
