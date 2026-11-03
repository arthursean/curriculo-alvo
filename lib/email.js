import "server-only";

// Endereço público do site, usado nos links dos e-mails. Nunca vem do cabeçalho Host
// da requisição, para que ninguém consiga forjar um link de recuperação apontando para outro site.
export function urlDoSite() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const escapar = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function enviarEmail({ para, assunto, html, texto }) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[e-mail não enviado: RESEND_API_KEY ausente]\nPara: ${para}\nAssunto: ${assunto}\n${texto}\n`);
      return;
    }
    throw new Error("RESEND_API_KEY não configurada");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Currículo Alvo <onboarding@resend.dev>",
      to: [para],
      subject: assunto,
      html,
      text: texto,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend respondeu ${res.status}: ${await res.text()}`);
}

export async function enviarEmailRecuperacao({ para, nome, token }) {
  const link = `${urlDoSite()}/redefinir-senha?token=${encodeURIComponent(token)}`;
  await enviarEmail({
    para,
    assunto: "Redefinir sua senha – Currículo Alvo",
    texto: `Olá, ${nome}.\n\nRecebemos um pedido para redefinir a senha da sua conta no Currículo Alvo.\nAbra o link abaixo para criar uma nova senha (válido por 1 hora, uso único):\n\n${link}\n\nSe não foi você, ignore este e-mail: sua senha continua a mesma.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#1b1f2a">
  <h2 style="color:#3550dc">Currículo Alvo</h2>
  <p>Olá, ${escapar(nome)}.</p>
  <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
  <p><a href="${escapar(link)}" style="display:inline-block;background:#3550dc;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Criar nova senha</a></p>
  <p style="color:#5d6475;font-size:14px">O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
</div>`,
  });
}
