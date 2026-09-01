import "./globals.css";
import { Inter_Tight, Bebas_Neue } from "next/font/google";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
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
      <body className={`${interTight.variable} ${bebasNeue.variable}`}>
        {children}
      </body>
    </html>
  );
}
