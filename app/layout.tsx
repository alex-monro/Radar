import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Radar",
  description: "Accessibility scanner by Gravity",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" className={dmSans.variable}>
      <body suppressHydrationWarning>
        <Nav />
        {/* children = the current page. e.g. app/page.tsx for "/", app/results/page.tsx for "/results" */}
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
};

export default RootLayout;
