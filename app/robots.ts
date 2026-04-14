import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tenantswap.africa").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/vacancies", "/register", "/login"],
        disallow: [
          "/dashboard",
          "/contacts",
          "/settings",
          "/engine",
          "/admin",
          "/sso",
          "/verify-phone",
          "/verify-email",
          "/resend-verification",
          "/password",
          "/register/oauth",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
