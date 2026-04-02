import "./globals.css";

export const metadata = {
  title: "ProCalc — Ingeniería de Costos",
  description: "Suite profesional para análisis de costos y presupuestos de obra",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
