// Layout compartido del shell SaaS (/auth, /app, /account, /pricing).
// Importa la hoja saas.css con la paleta del producto (más densa que la landing).

import "./saas.css";

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
