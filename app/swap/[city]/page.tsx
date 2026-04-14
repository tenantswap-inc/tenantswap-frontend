import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import GuestLayout from "@/app/GuestLayout";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tenantswap.africa").replace(/\/$/, "");

// ─── City data ────────────────────────────────────────────────────────────────

const CITIES: Record<string, {
  name: string;
  state: string;
  areas: string[];
  description: string;
  longDescription: string;
}> = {
  lagos: {
    name: "Lagos",
    state: "Lagos State",
    areas: ["Victoria Island", "Lekki", "Ajah", "Yaba", "Surulere", "Ikeja", "Ikorodu", "Gbagada", "Magodo", "Ojodu Berger"],
    description: "Swap apartments in Lagos without paying agent fees. Connect directly with tenants leaving flats in Lekki, Victoria Island, Yaba, Surulere and everywhere in between.",
    longDescription: `Lagos is Nigeria's most competitive rental market — which means agents charge the most and deliver the least. TenantSwap was built specifically for tenants tired of paying 10–15% agency commission just to rent a flat.\n\nOn TenantSwap, you list your current apartment and tell us where you want to move. Our matching engine finds another tenant who wants your area and is leaving somewhere you want to go. You connect, inspect, and deal directly with the landlord. No agent ever gets involved.`,
  },
  abuja: {
    name: "Abuja",
    state: "FCT Abuja",
    areas: ["Wuse", "Maitama", "Garki", "Gwarinpa", "Jabi", "Utako", "Lifecamp", "Lugbe", "Kubwa", "Asokoro"],
    description: "Find apartments in Abuja and swap with zero agent fees. TenantSwap connects tenants directly in Wuse, Maitama, Gwarinpa, Jabi and all Abuja districts.",
    longDescription: `Abuja's rental market is known for high prices and even higher agent fees. Whether you're in Maitama looking to move to Gwarinpa, or in Kubwa looking for something closer to the CBD — TenantSwap helps you find that match without a middleman.\n\nOur platform connects FCT tenants who are leaving flats with seekers who want exactly those areas. No agency commission, no inspection fee, no middleman.`,
  },
  "port-harcourt": {
    name: "Port Harcourt",
    state: "Rivers State",
    areas: ["GRA", "Ada George", "Rumuola", "Trans-Amadi", "Mile 1", "Mile 3", "Eliozu", "Woji", "Rumuigbo"],
    description: "Swap apartments in Port Harcourt with no agent fees. TenantSwap connects tenants in GRA, Ada George, Rumuola, Trans-Amadi and all PH areas.",
    longDescription: `Port Harcourt's oil-city economy pushes rents up — and agents take full advantage. TenantSwap gives PH tenants a direct way to find their next apartment by matching with someone who's leaving the exact area they want.\n\nWhether you're in GRA looking to downsize, or in Rumuola looking for something bigger, TenantSwap finds your match and lets you connect directly with the other tenant and their landlord.`,
  },
  ibadan: {
    name: "Ibadan",
    state: "Oyo State",
    areas: ["Bodija", "Agodi GRA", "Ring Road", "Challenge", "Oluyole", "Iwo Road", "Dugbe", "Isale Ijebu"],
    description: "Find and swap apartments in Ibadan with zero agent fees. TenantSwap connects Ibadan tenants in Bodija, Agodi GRA, Oluyole and all areas.",
    longDescription: `Ibadan may have lower rents than Lagos, but agents still take their cut. TenantSwap removes them from the equation entirely. Connect with tenants leaving apartments in your target area and deal directly with landlords.`,
  },
};

export function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const data = CITIES[city];
  if (!data) return {};

  const title = `Swap Apartments in ${data.name} — Zero Agent Fees | TenantSwap`;
  const description = data.description;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/swap/${city}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/swap/${city}`,
      type: "website",
    },
  };
}

export default async function CitySwapPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = CITIES[city];
  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Swap Apartments in ${data.name} — Zero Agent Fees`,
    description: data.description,
    url: `${siteUrl}/swap/${city}`,
    isPartOf: { "@type": "WebSite", name: "TenantSwap Nigeria", url: siteUrl },
    about: {
      "@type": "RealEstateAgent",
      name: "TenantSwap",
      description: `Peer-to-peer apartment swap platform in ${data.name}, ${data.state}`,
      areaServed: { "@type": "City", name: data.name, containedIn: { "@type": "State", name: data.state } },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuestLayout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

            {/* Hero */}
            <div className="mb-12">
              <p className="text-primary-green font-bold uppercase tracking-widest text-xs sm:text-sm mb-3">
                {data.state}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Swap Apartments in {data.name} —{" "}
                <span className="text-primary-green">Zero Agent Fees</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
                {data.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-block bg-primary-green text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-primary-green/90 transition-all shadow-lg text-center"
                >
                  Start Swapping in {data.name}
                </Link>
                <Link
                  href="/vacancies"
                  className="inline-block border-2 border-primary-green text-primary-green px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-50 transition-all text-center"
                >
                  Browse {data.name} Vacancies
                </Link>
              </div>
            </div>

            {/* Long copy — this is what Google reads */}
            <section className="mb-12 prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                How TenantSwap Works in {data.name}
              </h2>
              {data.longDescription.split("\n\n").map((para, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-4">{para}</p>
              ))}
            </section>

            {/* Areas — great for long-tail keywords */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Popular Areas in {data.name}
              </h2>
              <p className="text-slate-600 mb-6">
                TenantSwap has listings across {data.name}. These are the most active neighbourhoods:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.areas.map((area) => (
                  <div
                    key={area}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                  >
                    {area}
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ — triggers FAQ rich snippets in Google */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-5">
                {[
                  {
                    q: `How do I swap an apartment in ${data.name} without an agent?`,
                    a: `Create a free account on TenantSwap, list your current apartment, and tell us what you're looking for in ${data.name}. Our matching engine finds other tenants who want your area while they're leaving somewhere you want to move. You then connect directly — no agent involved.`,
                  },
                  {
                    q: `Is TenantSwap free to use in ${data.name}?`,
                    a: `Yes. Creating a listing and browsing matches is free. TenantSwap earns through a small premium subscription for unlocking contact details — far cheaper than any agent commission.`,
                  },
                  {
                    q: `Which areas in ${data.name} does TenantSwap cover?`,
                    a: `TenantSwap covers all of ${data.name} including ${data.areas.slice(0, 5).join(", ")} and more. You can specify any area when creating your listing.`,
                  },
                  {
                    q: `Do I need to be leaving my current apartment to use TenantSwap?`,
                    a: `No. If you're just looking for a new apartment in ${data.name} without swapping — you can create a "seeker" listing and connect with landlords and tenants who are vacating.`,
                  },
                ].map(({ q, a }) => (
                  <details key={q} className="rounded-xl border border-slate-200 p-5 group">
                    <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-center justify-between">
                      {q}
                      <span className="text-slate-400 group-open:rotate-180 transition-transform ml-4">▼</span>
                    </summary>
                    <p className="mt-3 text-slate-600 leading-relaxed text-sm">{a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Ready to find your next apartment in {data.name}?
              </h2>
              <p className="text-slate-600 mb-6">
                Join hundreds of {data.name} tenants who are swapping without agents.
              </p>
              <Link
                href="/register"
                className="inline-block bg-primary-green text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-primary-green/90 transition-all shadow-lg"
              >
                Get Started — It&apos;s Free
              </Link>
            </div>

            {/* Other cities */}
            <div className="mt-12">
              <p className="text-sm font-medium text-slate-500 mb-3">Also available in:</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(CITIES)
                  .filter(([slug]) => slug !== city)
                  .map(([slug, c]) => (
                    <Link
                      key={slug}
                      href={`/swap/${slug}`}
                      className="text-sm text-primary-green font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </GuestLayout>
    </>
  );
}
