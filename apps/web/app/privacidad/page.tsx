import type { Metadata } from "next";
import PrivacidadContent from "../legal/PrivacidadContent";

export const metadata: Metadata = { title: "Aviso de privacidad — Hilonova" };

export default function PrivacidadPage() {
  return <PrivacidadContent />;
}
