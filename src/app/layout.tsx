import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worksfou - Job Search and Apply",
  description: "Worksuite is a platform that helps you find and apply to jobs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
