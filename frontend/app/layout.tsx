import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/lib/suppress-hydration"; // Suppress browser extension hydration warnings
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingButtons } from "@/components/layout/FloatingButtons";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Skardu Mobile - Premium Second-Hand Phones",
  description: "Discover Skardu Mobile's premium collection of certified second-hand phones. Top quality, verified condition, unbeatable prices.",
  keywords: ["phones", "second-hand", "used phones", "mobile", "Skardu", "Pakistan", "Skardu Mobile"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange={false}
              >
                <Navbar />
                <main className="min-h-[calc(100vh-4rem)]">
                  {children}
                </main>
                <Footer />
                <FloatingButtons />
              </ThemeProvider>
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
