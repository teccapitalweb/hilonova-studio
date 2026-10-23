// Contenido de la ayuda dentro de la app (lo usa Ayuda.tsx). Está aparte de los componentes para poder
// revisarlo con pruebas (que cubra todas las pantallas y que los atajos existan).

import type { View } from "./store";

export interface HelpSection {
  title: string;
  /** pasos o explicaciones, en orden */
  steps: string[];
  /** consejos cortos al final */
  tips?: string[];
}

/** Ayuda de la pantalla en que está el alumno. */
export const HELP_BY_VIEW: Record<View, HelpSection> = {
  proyectos: {
    title: "Proyectos: tus patrones guardados",
    steps: [
      "Aquí están todos tus patrones. Abre uno con «Abrir», haz una copia con «Duplicar» o bórralo con «Eliminar».",
      "«+ Desde una prenda base» te deja elegir una prenda (blusa, pantalón, falda…) que ya viene con sus piezas, y se ajusta a tus medidas.",
      "«+ En blanco» abre un lienzo vacío para dibujar tus propias piezas desde cero (en la pestaña «Patrón en blanco» de esta ayuda está el paso a paso).",
    ],
    tips: [
      "Tus patrones se guardan solos en este navegador y en tu cuenta (en la nube): puedes abrirlos en otra computadora. Los materiales y «Mis piezas» viven solo en este navegador: descarga un respaldo en Configuración.",
    ],
  },
  editor: {
    title: "Patronaje 2D: dibuja y ajusta las piezas",
    steps: [
      "Si empezaste desde una prenda base, ya tienes las piezas. Con el botón «Medidas» (arriba) cambias las medidas y el patrón se redibuja solo.",
      "Para dibujar una pieza: elige Polilínea (L) o Curva (C), haz clic en cada esquina y cierra la pieza haciendo clic en el primer punto (o con Enter). Para formas rápidas están Rectángulo (R) y Círculo (O).",
      "Para ajustar: con Seleccionar (V) arrastra un nodo (punto), una manija de curva o la pieza completa. Con Agregar nodo (A) pones un punto nuevo sobre un contorno.",
      "Para marcar: Piquete (N) en un nodo, Pinza (P) con dos clics, Texto (T) para notas y Medir (M) para ver una distancia.",
      "Selecciona una pieza para cambiar su nombre, cuántas se cortan, la tela, el margen de costura y la dirección del hilo en el panel «Propiedades».",
      "«+ Biblioteca» (panel de piezas, a la izquierda) agrega piezas ya hechas: delanteros, espaldas, mangas, cuellos, bolsillos.",
    ],
    tips: [
      "Ctrl+Z deshace y Ctrl+Shift+Z rehace. El proyecto se guarda solo unos segundos después de cada cambio.",
      "Los botones de la columna de la izquierda activan la rejilla con imán (snap), el nido de tallas y el margen de costura.",
    ],
  },
  graduacion: {
    title: "Graduación: de una talla a todas las demás",
    steps: [
      "Graduar es agrandar o achicar el patrón para las demás tallas. Elige la gama de tallas y cuál es la talla base.",
      "Si el patrón viene de una prenda base, la tabla de tallaje muestra cuántos centímetros crece cada medida por talla. Puedes cambiar esos centímetros y el patrón se gradúa solo.",
      "Para ajustar a mano: selecciona un nodo en el lienzo y escribe cuánto se mueve (Δx a lo ancho, Δy a lo largo) en cada talla.",
      "Enciende el «Nido de tallas» en el lienzo para ver todas las tallas encimadas; cada color es una talla.",
    ],
    tips: [
      "En un patrón en blanco no hay tabla de tallaje: la graduación se hace nodo por nodo.",
    ],
  },
  trazo: {
    title: "Trazo: acomodar las piezas en la tela",
    steps: [
      "El trazo acomoda todas las piezas (con sus copias) en el ancho de la tela y calcula cuánta tela gastas.",
      "Elige la tela: su ancho y su precio (puedes traerlos de la pestaña Materiales con «Usar en el trazo»).",
      "Ve el trazo de cada talla, o el «Combinado» con una prenda de cada talla en la misma tela.",
      "Fíjate en el consumo por prenda (en metros) y en el aprovechamiento (qué porcentaje de la tela se usa).",
      "Exporta el trazo a DXF (para Gerber, Lectra o corte), PDF a escala 1:1 (para plotter) o SVG.",
    ],
    tips: ["Si el aprovechamiento es bajo, prueba el trazo combinado: mezclar tallas suele rendir más."],
  },
  produccion: {
    title: "Producción: ficha técnica y variantes",
    steps: [
      "«Ficha técnica» es el documento para la fábrica: portada, tabla de medidas por talla, vistas planas y lista de materiales. Se llena aquí y se descarga como PDF desde Exportar.",
      "«Variantes de modelo» guarda versiones del mismo diseño (por ejemplo manga 3/4, otro largo o cuello mao) para cambiar entre ellas y comparar cuánta tela gasta cada una.",
    ],
  },
  materiales: {
    title: "Materiales: telas, forros y avíos",
    steps: [
      "Guarda aquí las telas, forros, entretelas y avíos del taller con su ancho y su precio.",
      "«Usar en el trazo» fija el ancho y el precio de esa tela en la pestaña Trazo.",
    ],
  },
  libreria: {
    title: "Librería: piezas ya hechas",
    steps: [
      "Aquí hay piezas de fábrica (delanteros, espaldas, mangas, cuellos, puños, bolsillos…) y «Mis piezas», las que tú guardas.",
      "Al insertar una pieza se agrega al proyecto que tienes abierto.",
      "Para guardar una pieza propia: selecciónala en Patronaje 2D y usa «Guardar en Librería» en el panel Propiedades.",
    ],
  },
  reportes: {
    title: "Reportes: consumo y costo",
    steps: [
      "Resume el proyecto: cuánta tela y cuánto cuesta por talla, y el listado de piezas.",
      "Descárgalo como CSV (para abrirlo en Excel) o imprímelo.",
    ],
  },
  config: {
    title: "Configuración: preferencias y respaldo",
    steps: [
      "Ajusta la rejilla, el imán (snap), el margen de costura y el ancho de tela que usa el editor.",
      "«Descargar respaldo completo» guarda en un archivo todos tus proyectos, materiales y piezas. «Restaurar respaldo» los vuelve a cargar sin borrar nada.",
      "También puedes exportar un solo proyecto a un archivo e importarlo en otro equipo.",
    ],
    tips: ["Descarga un respaldo cada semana: los materiales y «Mis piezas» viven solo en este navegador."],
  },
};

/** Los primeros pasos, en el orden en que se usa el programa. */
export const HELP_FLOW: HelpSection = {
  title: "Primeros pasos",
  steps: [
    "1. Proyectos: crea un patrón «Desde una prenda base» (ya trae las piezas) o «En blanco» (lo dibujas tú).",
    "2. Patronaje 2D: ajusta las medidas y las piezas hasta que el patrón esté como lo quieres.",
    "3. Graduación: define las tallas y cómo crece el patrón de una a otra.",
    "4. Trazo: acomoda las piezas en la tela y mira cuánta tela gastas.",
    "5. Producción: llena la ficha técnica para la fábrica.",
    "6. Exportar (arriba a la derecha): DXF para Gerber o Lectra, PDF o SVG.",
  ],
  tips: ["No hace falta guardar a mano: el proyecto se guarda solo. Descarga un respaldo en Configuración de vez en cuando."],
};

/** Cómo empezar un patrón en blanco. */
export const HELP_BLANK: HelpSection = {
  title: "Patrón en blanco: dibuja desde cero",
  steps: [
    "1. Dibuja la primera pieza: elige Polilínea (L), haz clic en cada esquina y cierra haciendo clic en el primer punto (o Enter). Con Curva (C) las líneas salen suaves.",
    "2. Afina la forma: con Seleccionar (V) arrastra los nodos; con Agregar nodo (A) pones más puntos; arrastra las manijas para curvar.",
    "3. Selecciónala y en «Propiedades» ponle nombre (por ejemplo «Delantero») y cuántas piezas se cortan.",
    "4. Marca piquetes (N) en los puntos que se unen con otra pieza, y pinzas (P) si las lleva.",
    "5. Repite con cada pieza. Para piezas comunes (mangas, cuellos, bolsillos) usa «+ Biblioteca». Para copiar una pieza, Ctrl+D la duplica y «Espejar» la voltea.",
    "6. Comprueba que las costuras miden lo mismo con la herramienta Costura (S).",
    "7. Para graduar, ve a la pestaña Graduación: selecciona cada nodo y escribe cuánto se mueve por talla.",
  ],
  tips: [
    "En un patrón en blanco no hay medidas del cuerpo: el botón «Medidas» no aplica porque el programa no sabe qué prenda es. Todo se dibuja en centímetros reales.",
    "Si prefieres que el programa dibuje las piezas por ti, elige «Desde una prenda base» en Proyectos.",
  ],
};

/** Herramientas del editor y sus atajos de teclado. */
export const HELP_TOOLS: Array<{ keys: string; what: string }> = [
  { keys: "V", what: "Seleccionar y mover nodos, manijas o piezas" },
  { keys: "H", what: "Mano: mover la vista" },
  { keys: "L", what: "Polilínea: dibujar una pieza con líneas rectas" },
  { keys: "C", what: "Curva: dibujar una pieza con curvas suaves" },
  { keys: "R", what: "Rectángulo" },
  { keys: "O", what: "Círculo" },
  { keys: "A", what: "Agregar un nodo sobre un contorno" },
  { keys: "S", what: "Costura: comparar cuánto miden dos tramos que se cosen" },
  { keys: "P", what: "Pinza: clic en el contorno y luego dentro de la pieza" },
  { keys: "N", what: "Piquete en un nodo" },
  { keys: "T", what: "Texto sobre una pieza (nota, medida, instrucción)" },
  { keys: "M", what: "Medir una distancia" },
  { keys: "Shift o Alt + arrastrar", what: "Mover la vista" },
  { keys: "Rueda del ratón", what: "Acercar y alejar" },
  { keys: "Ctrl + clic", what: "Seleccionar varias piezas" },
  { keys: "Ctrl + A", what: "Seleccionar todas las piezas" },
  { keys: "Ctrl + C / Ctrl + V", what: "Copiar y pegar" },
  { keys: "Ctrl + D", what: "Duplicar" },
  { keys: "Supr", what: "Borrar lo seleccionado" },
  { keys: "Ctrl + Z / Ctrl + Shift + Z", what: "Deshacer y rehacer" },
  { keys: "Esc", what: "Cancelar lo que estás dibujando" },
];
