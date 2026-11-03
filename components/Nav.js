"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/perfil", "Meu perfil"],
  ["/curriculo", "Currículo base"],
  ["/vagas", "Buscar vagas"],
  ["/meus-curriculos", "Currículos salvos"],
];

export default function Nav() {
  const path = usePathname();
  const [usuario, setUsuario] = useState(undefined);

  useEffect(() => {
    fetch("/api/auth/eu", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUsuario(d.usuario || null))
      .catch(() => setUsuario(null));
  }, []);

  async function sair() {
    await fetch("/api/auth/sair", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">Currículo<span>Alvo</span></Link>
        {usuario && LINKS.map(([href, nome]) => (
          <Link key={href} href={href} className={`link ${path.startsWith(href) ? "ativo" : ""}`}>{nome}</Link>
        ))}
        <div style={{ marginLeft: "auto" }} className="row">
          {usuario === null && (
            <>
              <Link href="/entrar" className="link">Entrar</Link>
              <Link href="/cadastrar" className="btn sm">Criar conta</Link>
            </>
          )}
          {usuario && (
            <>
              <Link href="/conta" className={`link ${path === "/conta" ? "ativo" : ""}`}>{usuario.nome.split(" ")[0]}</Link>
              <button className="btn sec sm" onClick={sair}>Sair</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
