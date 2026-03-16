import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HealthHelp - ระบบแจ้งเหตุและติดตามปัญหา",
  description: "ระบบ Helpdesk สำหรับแจ้งปัญหา ติดตามสถานะ และจัดการเคสอย่างมีประสิทธิภาพ",
  keywords: ["helpdesk", "health", "support", "tracking", "ระบบแจ้งเหตุ"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: "1.0625rem",
              fontWeight: "600",
              padding: "1rem 1.25rem",
              borderRadius: "0.875rem",
              maxWidth: "420px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              lineHeight: "1.5",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
