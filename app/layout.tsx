import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Providers } from "./provider";
import PostHogProvider from "@/components/PostHogProvider";
import { Analytics } from "@vercel/analytics/next";


const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tenantswap.africa").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TenantSwap — Swap Apartments in Nigeria, Zero Agent Fees",
    template: "%s | TenantSwap Nigeria",
  },
  description:
    "TenantSwap helps Nigerian tenants swap apartments directly — no agent, no agency fees. Find your next home in Lagos, Abuja, Port Harcourt and more.",
  keywords: [
    "apartment swap Nigeria",
    "house swap Lagos",
    "no agent fee apartment Nigeria",
    "find apartment Lagos",
    "tenantswap",
    "swap house Abuja",
    "affordable apartments Nigeria",
    "rent apartment Nigeria",
  ],
  authors: [{ name: "TenantSwap", url: siteUrl }],
  creator: "TenantSwap",
  publisher: "TenantSwap",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    siteName: "TenantSwap Nigeria",
    title: "TenantSwap — Swap Apartments in Nigeria, Zero Agent Fees",
    description:
      "Find your next apartment or swap your current one — no agent, no fees. TenantSwap connects Nigerian tenants directly.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TenantSwap — Zero Agent Fees",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TenantSwap — Swap Apartments in Nigeria, Zero Agent Fees",
    description: "No agent, no fees. Swap apartments directly with other Nigerian tenants.",
    images: [`${siteUrl}/og-image.png`],
    creator: "@tenantswap",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TenantSwap",
  },
  themeColor: "#059669",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  const clientId = process.env.GOOGLE_CLIENT_ID as string;
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          #ts-splash {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #059669;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            transition: opacity 0.35s ease, visibility 0.35s ease;
          }
          #ts-splash.hidden {
            opacity: 0;
            visibility: hidden;
          }
          #ts-splash img {
            width: 80px;
            height: 80px;
            animation: ts-pulse 1.4s ease-in-out infinite;
          }
          #ts-splash-ring {
            width: 52px;
            height: 52px;
            border: 3px solid rgba(255,255,255,0.25);
            border-top-color: #fff;
            border-radius: 50%;
            animation: ts-spin 0.9s linear infinite;
          }
          @keyframes ts-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(0.92); opacity: 0.85; }
          }
          @keyframes ts-spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </head>
      <body className={` antialiased`}>
        {/* Logo splash — hidden by JS once React mounts */}
        <div id="ts-splash">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/TenantSwap Logo Monochrome.svg" alt="TenantSwap" />
          <div id="ts-splash-ring" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function hideSplash() {
              var el = document.getElementById('ts-splash');
              if (el) { el.classList.add('hidden'); }
            }
            if (document.readyState === 'complete') {
              hideSplash();
            } else {
              window.addEventListener('load', hideSplash);
            }
          })();
        `}} />
        <PostHogProvider>
          <Providers>
            <GoogleOAuthProvider clientId={clientId}>
              {children}
            </GoogleOAuthProvider>
          </Providers>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}