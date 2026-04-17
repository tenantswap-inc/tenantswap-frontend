import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "TenantSwap — Swap Apartments in Nigeria, Zero Agent Fees";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontBold = readFileSync(
    path.join(process.cwd(), "public/fonts/poppins/Poppins-ExtraBold.ttf")
  );
  const fontRegular = readFileSync(
    path.join(process.cwd(), "public/fonts/poppins/Poppins-Regular.ttf")
  );
  const logoData = readFileSync(
    path.join(process.cwd(), "public/assets/TenantSwap Logo Combination monochrome.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#059669",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "64px 80px",
          fontFamily: "Poppins",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration circles */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            right: -100,
            top: -100,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            right: 120,
            bottom: -60,
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="TenantSwap"
          width={220}
          height={56}
          style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
        />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 100,
              padding: "8px 20px",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
            <span style={{ color: "#fff", fontSize: 18, fontFamily: "Poppins", letterSpacing: 2 }}>
              ZERO AGENT FEES
            </span>
          </div>

          <h1
            style={{
              color: "#fff",
              fontSize: 68,
              fontFamily: "Poppins",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Swap Apartments.
            <br />
            <span style={{ color: "rgba(255,255,255,0.75)" }}>No Agent. No Fees.</span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 26,
              fontFamily: "Poppins",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Connect directly with Nigerian tenants in Lagos,
            <br />
            Abuja, Port Harcourt &amp; more.
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: 24,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 20, fontFamily: "Poppins" }}>
            tenantswap.africa
          </span>
          <div style={{ display: "flex", gap: 32 }}>
            {["Lagos", "Abuja", "Port Harcourt", "Ibadan"].map((city) => (
              <span
                key={city}
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 18,
                  fontFamily: "Poppins",
                }}
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: fontBold, weight: 800 },
        { name: "Poppins", data: fontRegular, weight: 400 },
      ],
    }
  );
}
