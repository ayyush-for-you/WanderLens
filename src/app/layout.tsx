import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WanderLens — Discover Heritage Differently",
    template: "%s | WanderLens",
  },
  description:
    "Scan monuments for their history, find hidden gems ranked by real community activity, and travel safely with groups and nearby travellers.",
  keywords: ["heritage travel", "monument scan", "hidden gems", "India travel", "group travel safety"],
  authors: [{ name: "WanderLens" }],
  creator: "WanderLens",
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "WanderLens — Discover Heritage Differently",
    description: "Scan monuments, discover hidden gems, travel safely.",
    siteName: "WanderLens",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WanderLens",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0e0d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#221f1c",
              color: "#f5f0eb",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "0.875rem",
              fontFamily: "Inter, sans-serif",
              maxWidth: "360px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            },
            success: {
              iconTheme: { primary: "#2dd4bf", secondary: "#001a18" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#1a0800" },
            },
          }}
        />
      </body>
    </html>
  );
}
