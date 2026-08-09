import "./globals.css";

export const metadata = {
  title: "MTR Team — نظام تتبع اللاعبين",
  description: "Player tracking & performance analytics for BJJ / MMA",
  manifest: "/manifest.json",
  themeColor: "#C8102E",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MTR Team",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
