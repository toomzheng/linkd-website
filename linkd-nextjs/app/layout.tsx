import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inconsolata = Inconsolata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "block",
  variable: "--font-inconsolata",
  preload: true,
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "Linkd Inc.",
  description: "Discover people through shared experiences.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://linkd.inc",
    title: "Linkd Inc.",
    description: "Discover people through shared experiences.",
    siteName: "Linkd Inc.",
    images: [
      {
        url: "https://linkd.inc/logo.png",
        width: 1200,
        height: 630,
        alt: "Linkd Inc. logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@uselinkd",
    creator: "@uselinkd",
    title: "Linkd Inc.",
    description: "Discover people through shared experiences.",
    images: ["https://linkd.inc/logo.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RSW8XT7RP8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RSW8XT7RP8');
          `}
        </Script>

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Linkd Inc.",
              "url": "https://linkd.inc",
              "logo": "https://linkd.inc/logo.png",
              "sameAs": [
                "https://www.linkedin.com/company/linkd-inc",
                "https://x.com/uselinkd"
              ]
            })
          }}
        />
      </head>
      <body className={`${inconsolata.className} ${inconsolata.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
