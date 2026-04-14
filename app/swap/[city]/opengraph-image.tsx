import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "TenantSwap — Swap Apartments, Zero Agent Fees";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CITY_NAMES: Record<string, string> = {
  lagos: "Lagos",
  abuja: "Abuja",
  "port-harcourt": "Port Harcourt",
  ibadan: "Ibadan",
};

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityName = CITY_NAMES[city] ?? city;

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
        {/* Background circles */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 100,
              padding: "8px 20px",
              color: "#fff",
              fontSize: 18,
              letterSpacing: 2,
            }}
          >
            {cityName.toUpperCase()} · ZERO AGENT FEES
          </div>

          <h1
            style={{
              color: "#fff",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Swap Apartments
            <br />
            in {cityName}
          </h1>

          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 28, margin: 0 }}>
            No agent. No inspection fee. Connect directly with tenants.
          </p>
        </div>

        {/* Bottom */}
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
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }}>tenantswap.africa</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 20 }}>
            Find · Match · Swap
          </span>
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
