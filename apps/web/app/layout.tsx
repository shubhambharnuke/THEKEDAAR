import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "THEKEDAR | College Resource Booking & Permission Management System",
  description:
    "Institutional campus facility scheduling, deterministic conflict prevention, parallel multi-department approvals, RSA-PSS digital signatures, and Ethereum Sepolia on-chain notary verification.",
  keywords: [
    "Campus Resource Booking",
    "Institutional Control System",
    "College Venue Management",
    "Digital Permission Letters",
    "Ethereum Sepolia Notary",
    "Cryptographic Verification",
  ],
  authors: [{ name: "Institutional Campus Operations & Engineering" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "THEKEDAR | College Resource Booking & Permission Management",
    description:
      "Create event requests, coordinate permissions across departments, and access tamper-evident signed permission letters backed by Sepolia on-chain proofs.",
    type: "website",
    locale: "en_US",
    siteName: "THEKEDAR Institutional Operations",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen bg-paper text-ink font-sans antialiased selection:bg-neutral-200">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
