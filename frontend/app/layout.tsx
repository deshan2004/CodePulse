import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Next.js App Router වල App ෆෝල්ඩර් එක ඇතුලේ icon.svg තිබ්බාම 
// ස්වයංක්‍රීයවම Favicon එක ගන්න නිසා මෙතන වෙනම icons ලයින් එකක් ඕන වෙන්නේ නැහැ මචං.
export const metadata: Metadata = {
  title: "CodePulse",
  description: "Automated Software Quality Assurance (SQA) Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0F172A] text-slate-100">
        {children}
      </body>
    </html>
  );
}