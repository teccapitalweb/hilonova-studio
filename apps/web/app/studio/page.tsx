import { Suspense } from "react";
import PlanGate from "../components/PlanGate";
import Shell from "./Shell";
import "./studio.css";

export const metadata = {
  title: "Editor — Hilonova Studio",
};

export default function StudioPage() {
  // Shell usa useSearchParams (?id=...); en export estático necesita Suspense.
  return (
    <Suspense fallback={null}>
      <PlanGate>
        <Shell />
      </PlanGate>
    </Suspense>
  );
}
