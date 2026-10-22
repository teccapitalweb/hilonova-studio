// Graduación: cada nodo guarda cuánto se mueve (dx, dy en cm) por cada paso de
// talla respecto a la base. La talla `size` se obtiene desplazando cada nodo
// `pasos × grade`. Es el método estándar de reglas de graduación (grade rules).

import type { Node, PatternDoc, Piece } from "./doc";
import { sizeSteps } from "./sizes";

/** Pieza graduada `steps` pasos respecto a la base. */
export function gradePiece(piece: Piece, steps: number): Piece {
  if (steps === 0) return piece;
  return {
    ...piece,
    nodes: piece.nodes.map((n): Node =>
      n.grade
        ? { ...n, at: { x: n.at.x + steps * n.grade.dx, y: n.at.y + steps * n.grade.dy } }
        : n,
    ),
  };
}

/** Documento graduado a la talla `size` (la base se devuelve tal cual). */
export function gradeDoc(doc: PatternDoc, size: string): PatternDoc {
  const steps = sizeSteps(size, doc.baseSize);
  if (steps === 0) return doc;
  return { ...doc, pieces: doc.pieces.map((p) => gradePiece(p, steps)) };
}

/** Fija (o quita, con null) la regla de graduación de un nodo. */
export function setNodeGrade(
  doc: PatternDoc,
  pieceId: string,
  nodeId: string,
  grade: { dx: number; dy: number } | null,
): PatternDoc {
  return {
    ...doc,
    pieces: doc.pieces.map((p) =>
      p.id !== pieceId
        ? p
        : {
            ...p,
            nodes: p.nodes.map((n): Node => {
              if (n.id !== nodeId) return n;
              if (!grade || (grade.dx === 0 && grade.dy === 0)) {
                const { grade: _drop, ...rest } = n;
                return rest;
              }
              return { ...n, grade };
            }),
          },
    ),
  };
}

/** ¿La pieza tiene alguna regla de graduación? */
export const isGraded = (piece: Piece): boolean => piece.nodes.some((n) => !!n.grade);
