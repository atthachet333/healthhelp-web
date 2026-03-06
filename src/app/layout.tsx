import type { Metadata } from "next";
import "./globals.css";

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
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
