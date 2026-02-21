import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from 'next/font/google';


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '900'], // Specify the weights you need
  variable: '--font-poppins', // Use a CSS variable for Tailwind or global CSS
});


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
  openGraph: {
    title: "Tenant Swap",
    description: "Zero Agent Fees for Nigerian Tenants",
    url: `${url}`,
    siteName: "Tenant Swap",
    images: [{ url: `${url}` }],
  },
    icons: { icon: "/ABSG-Coat-of-Arms_Master.png" },

};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}