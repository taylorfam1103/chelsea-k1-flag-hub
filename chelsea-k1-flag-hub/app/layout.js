import "./globals.css";

export const metadata = {
  title: "Chelsea K/1 Flag Football",
  description: "Live standings, scores and schedule for Chelsea K/1 Flag Football.",
  manifest: "/manifest.webmanifest",
  themeColor: "#081521",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
