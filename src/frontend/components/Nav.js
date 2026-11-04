"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair, usuarioLogado } from "@/frontend/lib/api";

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
    usuarioLogado()
      .then((u) => setUsuario(u || null))
      .catch(() => setUsuario(null));
  }, []);

  async function sairDaConta() {
    await sair().catch(() => {});
    window.location.href = "/";
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">Currículo<span>Alvo</span></Link>
        {usuario && (
          <div className="nav-links">
            {LINKS.map(([href, nome]) => (
              <Link key={href} href={href} className={`link ${path.startsWith(href) ? "ativo" : ""}`}>{nome}</Link>
            ))}
          </div>
        )}
        <div className="row nav-conta">
          {usuario === null && (
            <>
              <Link href="/entrar" className="link">Entrar</Link>
              <Link href="/cadastrar" className="btn sm">Criar conta</Link>
            </>
          )}
          {usuario && (
            <>
              <Link href="/conta" className={`link ${path === "/conta" ? "ativo" : ""}`}>{usuario.nome.split(" ")[0]}</Link>
              <button className="btn sec sm" onClick={sairDaConta}>Sair</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
