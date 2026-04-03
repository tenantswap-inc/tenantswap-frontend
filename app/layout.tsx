import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Providers } from "./provider";
import PostHogProvider from "@/components/PostHogProvider";


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
      <body className={` antialiased`}>
        <PostHogProvider>
          <Providers>
            <GoogleOAuthProvider clientId={clientId}>
              {children}
            </GoogleOAuthProvider>
          </Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}