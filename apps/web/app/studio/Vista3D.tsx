// Vista 3D: el patrón armado sobre un cuerpo, para girar y revisar proporciones y tallas.
// Usa three.js (se carga solo al abrir esta vista). La geometría sale de drape.ts.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as T from "three";
import { gradeDoc } from "@hilonova/geometry";
import { SIZE_COLORS, useEditor } from "./store";
import { drapeDoc, drapeFamilyOf, type Drape } from "./drape";

const COLORS = [
  { name: "Azul", hex: "#5B7FBF" },
  { name: "Mezclilla", hex: "#3F5E8C" },
  { name: "Blanco", hex: "#E9E6DD" },
  { name: "Negro", hex: "#2A2A2E" },
  { name: "Rojo", hex: "#B8453B" },
  { name: "Verde", hex: "#4F8A63" },
  { name: "Arena", hex: "#C9B38F" },
];

type View = "front" | "side" | "back";

interface Rig {
  THREE: typeof T;
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  renderer: T.WebGLRenderer;
  controls: { target: T.Vector3; update(): void; autoRotate: boolean; enableDamping: boolean };
  group: T.Group;
  grid: T.GridHelper;
}

export default function Vista3D() {
  const doc = useEditor((s) => s.history.present);
  const [size, setSize] = useState(doc.baseSize);
  const [color, setColor] = useState(COLORS[0]!.hex);
  const [spin, setSpin] = useState(false);
  const [lines, setLines] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mount = useRef<HTMLDivElement>(null);
  const rigRef = useRef<Rig | null>(null);
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const framedFor = useRef<string>("");

  const family = drapeFamilyOf(doc.blockKind);
  const shownSize = doc.sizes.includes(size) ? size : doc.baseSize;
  const drape = useMemo<Drape | null>(
    () => (family ? drapeDoc(gradeDoc(doc, shownSize), family) : null),
    [doc, shownSize, family],
  );

  // ── escena (una sola vez) ──
  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const el = mount.current;
        if (disposed || !el) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        el.appendChild(renderer.domElement);
        renderer.domElement.style.display = "block";

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5568, 1.15));
        const key = new THREE.DirectionalLight(0xffffff, 1.5);
        key.position.set(120, 220, 260);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7);
        fill.position.set(-200, 80, -220);
        scene.add(fill);
        const grid = new THREE.GridHelper(400, 40, 0x56627a, 0x2a3345);
        scene.add(grid);
        const group = new THREE.Group();
        scene.add(group);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotateSpeed = 2.2;

        const resize = () => {
          const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
          renderer.setSize(w, h, false);
          renderer.domElement.style.width = "100%";
          renderer.domElement.style.height = "100%";
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        ro = new ResizeObserver(resize);
        ro.observe(el);

        const loop = () => {
          if (disposed) return;
          controls.autoRotate = spinRef.current;
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        rigRef.current = { THREE, scene, camera, renderer, controls: controls as Rig["controls"], group, grid };
        cleanup = () => {
          controls.dispose();
          disposeGroup(group);
          renderer.dispose();
          if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
        };
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo iniciar la vista 3D (¿WebGL desactivado?)");
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      cleanup?.();
      rigRef.current = null;
    };
  }, []);

  // ── prenda: se reconstruye al cambiar patrón, talla, color o contornos ──
  useEffect(() => {
    const rig = rigRef.current;
    if (!ready || !rig || !drape) return;
    const { THREE, group, grid } = rig;
    disposeGroup(group);
    const mat = new THREE.MeshStandardMaterial({
      color, side: THREE.DoubleSide, roughness: 0.88, metalness: 0, polygonOffset: true,
      polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0f1320 });
    for (const m of drape.meshes) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(m.positions, 3));
      g.setIndex(new THREE.BufferAttribute(m.indices, 1));
      g.computeVertexNormals();
      group.add(new THREE.Mesh(g, mat));
      if (lines) {
        const lg = new THREE.BufferGeometry();
        lg.setAttribute("position", new THREE.BufferAttribute(m.outline, 3));
        group.add(new THREE.LineLoop(lg, lineMat));
      }
    }
    grid.position.y = drape.min[1] - 2;

    // encuadre: al abrir una prenda o cambiar de talla, no al cambiar solo el color
    const key = `${doc.id}:${shownSize}`;
    if (framedFor.current !== key) {
      framedFor.current = key;
      frame(rig, drape, "front");
    }
  }, [ready, drape, color, lines, doc.id, shownSize]);

  function view(v: View) {
    const rig = rigRef.current;
    if (rig && drape) frame(rig, drape, v);
  }

  if (!family) {
    return (
      <div className="st-empty-big" style={{ margin: 24 }}>
        <strong>Esta prenda todavía no tiene vista 3D.</strong>
        <span>La vista 3D funciona con las prendas del catálogo (blusas, camisas, chamarras, sudaderas, vestido, faldas y pantalones).</span>
      </div>
    );
  }

  return (
    <div className="st-3d">
      <div ref={mount} className="st-3d-stage" aria-label="Vista 3D de la prenda" />
      {error && <div className="st-3d-error">No se pudo mostrar la vista 3D: {error}</div>}

      <div className="st-3d-bar st-3d-top">
        <span className="st-3d-lbl">Talla</span>
        {doc.sizes.map((s) => (
          <button
            key={s}
            className={`st-size${shownSize === s ? " on" : ""}${s === doc.baseSize ? " base" : ""}`}
            style={{ ["--size-color" as string]: SIZE_COLORS[s] ?? "#8A91FF" }}
            onClick={() => setSize(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="st-3d-bar st-3d-right">
        <div className="st-seg">
          <button onClick={() => view("front")}>Frente</button>
          <button onClick={() => view("side")}>Lado</button>
          <button onClick={() => view("back")}>Espalda</button>
        </div>
        <button className={`st-act${spin ? " on" : ""}`} onClick={() => setSpin((v) => !v)} style={{ marginTop: 0 }}>
          {spin ? "Detener giro" : "Girar"}
        </button>
        <button className={`st-act${lines ? " on" : ""}`} onClick={() => setLines((v) => !v)} style={{ marginTop: 0 }}>
          Contornos
        </button>
      </div>

      <div className="st-3d-bar st-3d-bottom">
        <span className="st-3d-lbl">Tela</span>
        {COLORS.map((c) => (
          <button
            key={c.hex}
            className={`st-swatch${color === c.hex ? " on" : ""}`}
            style={{ background: c.hex }}
            onClick={() => setColor(c.hex)}
            aria-label={`Color ${c.name}`}
            title={c.name}
          />
        ))}
        <span className="st-3d-note">
          Arrastra para girar · rueda para acercar. Vista aproximada: muestra delantero, espalda y mangas
          armados; cuellos, puños y bolsillos no se dibujan.
        </span>
      </div>
    </div>
  );
}

/** Coloca la cámara de frente, de lado o de espalda, encuadrando la prenda. */
function frame(rig: Rig, drape: Drape, v: View) {
  const { THREE, camera, controls } = rig;
  const h = drape.max[1] - drape.min[1];
  const w = Math.max(drape.max[0] - drape.min[0], drape.max[2] - drape.min[2]);
  const cy = (drape.min[1] + drape.max[1]) / 2;
  const radius = Math.max(h * 0.62, w * 0.75, 20);
  const dist = (radius / Math.tan((camera.fov * Math.PI) / 360)) * 1.05;
  controls.target.set(0, cy, 0);
  const dir = v === "front" ? new THREE.Vector3(0, 0.08, 1) : v === "back" ? new THREE.Vector3(0, 0.08, -1) : new THREE.Vector3(1, 0.08, 0);
  camera.position.copy(dir.normalize().multiplyScalar(dist)).add(new THREE.Vector3(0, cy, 0));
  camera.lookAt(0, cy, 0);
  controls.update();
}

function disposeGroup(group: T.Group) {
  for (const child of [...group.children]) {
    group.remove(child);
    const o = child as T.Mesh;
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) m.dispose();
  }
}
