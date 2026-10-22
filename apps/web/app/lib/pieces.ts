// "Mis piezas": piezas que el patronista guarda para reutilizar en otros proyectos.

"use client";

import type { Piece } from "@hilonova/geometry";
import { createCollection, newId } from "./collection";

export interface UserPiece {
  id: string;
  name: string;
  createdAt: string;
  piece: Piece;
}

export const userPieces = createCollection<UserPiece>("hilonova.pieces.v1");

export function saveUserPiece(piece: Piece): void {
  userPieces.upsert({
    id: newId("up"),
    name: piece.name,
    createdAt: new Date().toISOString(),
    piece,
  });
}
