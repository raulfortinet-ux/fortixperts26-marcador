import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "FortiXperts26 · Marcador PHP2Shell",
  description: "Marcador interactivo del laboratorio XPERTS26",
  icons: [{ rel: "icon", url: "/fortinet-mark.png" }]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
