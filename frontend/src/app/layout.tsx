// app/layout.tsx
"use client";
import "bootstrap/dist/css/bootstrap.min.css";
import SupabaseProvider from "../../lib/SupabaseProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
