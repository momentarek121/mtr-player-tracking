import "./globals.css";

export const metadata = {
  title: "MTR Team — نظام تتبع اللاعبين",
  description: "Player tracking & performance analytics for BJJ / MMA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
