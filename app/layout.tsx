import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "科技塔罗牌",
  description: "一套为现代人精神状态设计的赛博神谕卡牌。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
