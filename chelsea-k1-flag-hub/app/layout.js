import "./globals.css";
import { Inter_Tight, Barlow_Condensed } from "next/font/google";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Chelsea K/1 Flag Football",
  description: "Live standings, scores and schedule for Chelsea K/1 Flag Football.",
  manifest: "/manifest.webmanifest",
  themeColor: "#081521",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} ${barlowCondensed.variable}`}>
        {children}
      </body>
    </html>
  );
}
