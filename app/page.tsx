import type { Metadata } from "next";
import GuestLayout from "@/app/GuestLayout";
import { Landing } from "@/components/Landing";
import { HeroUIProvider } from "@heroui/react";

export const metadata: Metadata = {
  title: "TenantSwap — Swap Apartments in Nigeria, Zero Agent Fees",
  description:
    "TenantSwap helps Nigerian tenants swap apartments directly — no agent, no agency fees. Find your next home in Lagos, Abuja, Port Harcourt and more.",
  alternates: {
    canonical: "/",
  },
};

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tenantswap.africa").replace(/\/$/, "");

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is TenantSwap?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TenantSwap is a Nigerian platform that lets tenants swap apartments directly with each other — no agent, no agency fee, no inspection fee. You list your current apartment, tell us what you want, and we match you with another tenant.",
      },
    },
    {
      "@type": "Question",
      name: "How do I find an apartment in Lagos without an agent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create a free TenantSwap account, set up your listing with what you're looking for in Lagos, and our matching engine connects you directly with tenants leaving apartments in your target area. No agent is ever involved.",
      },
    },
    {
      "@type": "Question",
      name: "Is TenantSwap free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Creating a listing and getting matched is free. A small premium subscription unlocks contact details — still far cheaper than paying an agent 10–15% commission.",
      },
    },
    {
      "@type": "Question",
      name: "Which cities does TenantSwap cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TenantSwap currently covers Lagos, Abuja, Port Harcourt, and Ibadan, with more Nigerian cities being added.",
      },
    },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "TenantSwap",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/TenantSwap Logo.svg`,
      },
      sameAs: [
        "https://tiktok.com/@tenant_swap",
        "https://wa.me/2349060002040",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        areaServed: "NG",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "TenantSwap Nigeria",
      description: "Swap apartments in Nigeria with zero agent fees",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/vacancies?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: "TenantSwap — Swap Apartments in Nigeria, Zero Agent Fees",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      description:
        "TenantSwap helps Nigerian tenants swap apartments directly — no agent, no agency fees.",
      inLanguage: "en-NG",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <HeroUIProvider>
        <GuestLayout>
          <Landing />
        </GuestLayout>
      </HeroUIProvider>
    </>
  );
}
