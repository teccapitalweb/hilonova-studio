import type { Metadata } from "next";
import TerminosContent from "../legal/TerminosContent";

export const metadata: Metadata = { title: "Términos de uso — Hilonova" };

export default function TerminosPage() {
  return <TerminosContent />;
}
