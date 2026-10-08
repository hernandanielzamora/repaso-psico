import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Núcleo | Repaso de Psicología",
  description: "Practicá Psicología Experimental y Sanitaria con preguntas, casos y repaso por examen.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
