import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "./globals.css";

const inconsolata = Inconsolata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inconsolata",
});

export const metadata: Metadata = {
  title: "Linkd Inc.",
  description: "Discover people through shared experiences.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inconsolata.className} ${inconsolata.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
