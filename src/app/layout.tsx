import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { THEME_COLOR_CREAM } from "@/styles/theme-color";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "shiftly",
  description: "Small habits, big wins.",
  applicationName: "shiftly",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "shiftly",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/favicon-32", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-180", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR_CREAM,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
