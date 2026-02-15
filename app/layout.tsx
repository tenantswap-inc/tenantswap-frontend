import type { Metadata } from "next";
// import { Poppins } from "next/font/google";
import "./globals.css";
import Head from "next/head";

// const poppins = Poppins({
//   weight:"900",
//   style:"normal",
//   subsets:["latin","devanagari"]

// })


export const metadata: Metadata = {
  // title: "TenantSwap Nigeria - Zero Agent Fees",
  description: "Zero Agent Fees for Nigerian Tenants",
    metadataBase: new URL('https://tenantswap.com'),
  title: { default: 'TenantSwap Nigeria - Zero Agent Fees', template: '%s | My Site' },
  alternates: {
    canonical: 'https://tenantswap.com',
    languages: {
      'en-US': 'https://tenantswap.com/en-US',
      'de-DE': 'https://tenantswap.com/de-DE'
    }
  },
//   icons:{
//  icon: [
//       {  }, // Public folder
//     ],
//   },
  openGraph: {
    title: 'Tenant Swap',
    description: 'Zero Agent Fees for Nigerian Tenants',
    url: 'https://tenantswap.com',
    siteName: 'Tenant Swap',
    images: [{ url: 'https://tenantswap.com/' }]

}
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/ABSG-Coat-of-Arms_Master.png" />
      </Head>
      <body
        // className={`${poppins.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
