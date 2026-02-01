import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Low-code Studio (Next.js)",
  description: "React + Next.js rewrite of the low-code core renderer",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div>
              <p className="app-kicker">Low-code Core</p>
              <h1>Next.js Studio</h1>
              <p className="app-subtitle">
                结构化渲染、类型安全 schema、可扩展组件注册表。
              </p>
            </div>
            <div className="app-badge">Preview</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
