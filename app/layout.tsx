import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Providers } from "./provider";
import PostHogProvider from "@/components/PostHogProvider";
import { Analytics } from "@vercel/analytics/next";


const url = process.env.API_URL as string;

export const metadata: Metadata = {
  description: "Zero Agent Fees for Nigerian Tenants",
  title: { default: "TenantSwap Nigeria - Zero Agent Fees", template: "%s | My Site" },
  alternates: {
    canonical: `${url}`,
    languages: {
      "en-US": `${url}/en-US`,
      "de-DE": `${url}/de-DE`,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TenantSwap",
  },
  themeColor: "#059669",
  // openGraph: {
  //   title: "Tenant Swap",
  //   description: "Zero Agent Fees for Nigerian Tenants",
  //   url: `${url}`,
  //   siteName: "Tenant Swap",
  //   images: [{ url: `${url}` }],
  // },
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