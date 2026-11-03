import "@/frontend/styles/globals.css";
import Nav from "@/frontend/components/Nav";

export const metadata = {
  title: "Currículo Alvo",
  description: "Crie seu perfil, encontre vagas e gere um currículo personalizado para cada uma.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
