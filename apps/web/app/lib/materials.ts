// Materiales del taller: telas, forros, entretelas y avíos, con ancho y precio.
// Alimentan el trazo (ancho y precio de la tela) y el costo por prenda.

"use client";

import { createCollection, newId } from "./collection";

export type MaterialKind = "tela" | "forro" | "entretela" | "avio";

export interface Material {
  id: string;
  name: string;
  kind: MaterialKind;
  /** ancho útil en cm (solo telas, forros y entretelas) */
  widthCm: number;
  /** precio por metro (o por pieza en avíos), MXN */
  price: number;
  composition: string;
  note: string;
}

export const KIND_LABEL: Record<MaterialKind, string> = {
  tela: "Tela principal",
  forro: "Forro",
  entretela: "Entretela",
  avio: "Avío",
};

const seed = (): Material[] => [
  { id: newId("mat"), name: "Mezclilla 12 oz", kind: "tela", widthCm: 150, price: 120, composition: "100 % algodón", note: "Denim para jean slim" },
  { id: newId("mat"), name: "Popelina 120 hilos", kind: "tela", widthCm: 150, price: 85, composition: "97 % algodón · 3 % elastano", note: "Para blusas y camisas" },
  { id: newId("mat"), name: "Jersey algodón 180 gsm", kind: "tela", widthCm: 180, price: 110, composition: "100 % algodón peinado", note: "Para playeras (tubular abierto)" },
  { id: newId("mat"), name: "Gabardina stretch", kind: "tela", widthCm: 150, price: 130, composition: "98 % algodón · 2 % elastano", note: "Pantalón de vestir y falda" },
  { id: newId("mat"), name: "Entretela termoadherible", kind: "entretela", widthCm: 90, price: 38, composition: "Poliéster", note: "Cuello, puños y vistas" },
];

export const materials = createCollection<Material>("hilonova.materials.v1", seed);

export const blankMaterial = (): Material => ({
  id: newId("mat"),
  name: "Nuevo material",
  kind: "tela",
  widthCm: 150,
  price: 0,
  composition: "",
  note: "",
});
