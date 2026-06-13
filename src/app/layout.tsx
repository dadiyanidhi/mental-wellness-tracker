import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Saathi — Study Wellness Companion",
  description:
    "A privacy-first, exam-aware mental wellness companion for competitive-exam aspirants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppProvider>
          {/* Skip link is the first focusable element for keyboard users. */}
          <a href="#main" className="skip-link">
            Skip to main content
          </a>
          <Nav />
          <main id="main" className="mx-auto max-w-3xl px-4 py-6" tabIndex={-1}>
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
