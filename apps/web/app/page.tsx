import Link from "next/link";
import ScrollReveal from "./components/ScrollReveal";

/** path reutilizable del delantero de pantalón */
const PANT =
  "M96 44 L208 52 C236 118 240 190 230 258 C224 322 212 384 198 420 L120 420 C128 348 138 298 150 238 C116 232 100 198 94 152 C92 112 93 74 96 44 Z";

// Prefijo de assets. En dev local = ''. En GitHub Pages = '/hilonova-studio'.
// Lo lee de la env que inyecta next.config.mjs para que los <img>/<video>/CSS
// con paths absolutos (/img, /brand, /video) también se sirvan bajo el basePath.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p: string) => `${BASE}${p}`;

function Check({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandMark({ className = "mk" }: { className?: string }) {
  // Logo oficial. El webp incluye wordmark debajo; .brand .mk lo recorta vía
  // overflow+object-position para mostrar solo el monograma en el nav/footer.
  return (
    <span className={className} aria-hidden="true">
      <img src={asset("/brand/logo-oficial.webp")} alt="" />
    </span>
  );
}

export default function HomePage() {
  return (
    <>
      <ScrollReveal />

      {/* ===================== NAV ===================== */}
      <nav className="nav">
        <div className="nav-in">
          <Link className="brand" href="/">
            <BrandMark />
            hilonova
          </Link>
          <div className="nav-links">
            <a href="#flujo">Flujo</a>
            <a href="#funciones">Funciones</a>
            <a href="#precios">Precios</a>
            <a href="#recursos">Recursos</a>
          </div>
          <span className="sp" />
          <div className="nav-cta">
            <Link className="nav-login" href="/auth/signin">Iniciar sesión</Link>
            <Link className="btn btn-dark" href="/auth/signup">Crear cuenta</Link>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <header className="hero">
        <div className="hero-card">
          <div className="hero-grid">
            <div>
              <span className="eyebrow ondark">● Patronaje industrial para maquila</span>
              <h1>
                Del patrón<br />
                al corte, <span className="accent">sin fricción.</span>
              </h1>
              <p className="sub">
                Dibuja desde medidas, gradúa todas las tallas, optimiza el trazo y exporta en
                DXF-AAMA listo para tu Gerber o Lectra. Todo en un solo lugar.
              </p>
              <div className="hero-cta">
                <Link className="btn btn-accent" href="/auth/signup">
                  Crear cuenta
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link className="btn btn-ghost" href="/studio">Ver el editor</Link>
              </div>
              <div className="hero-stats">
                <div className="stat-pill"><b>−12%</b><span>merma de tela</span></div>
                <div className="stat-pill"><b>28–44</b><span>tallas graduadas</span></div>
                <div className="stat-pill"><b>DXF-AAMA</b><span>nativo</span></div>
              </div>
            </div>

            <div className="hero-prod">
              <div className="prod-canvas">
                <img src={asset("/img/hero-piece.jpg")} alt="Pieza de patrón de pantalón de mezclilla con anotaciones técnicas" />
              </div>
              <div className="chip c4">aprovechado <b>83%</b></div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================== STRIP ===================== */}
      <section className="strip">
        <div className="wrap strip-in">
          <span className="lbl">Compatible con tu planta:</span>
          <span className="strip-tag">Gerber</span>
          <span className="strip-tag">Lectra</span>
          <span className="strip-tag">DXF <b>AAMA/ASTM</b></span>
          <span className="strip-tag">Plotter HPGL</span>
          <span className="strip-tag">PDF mosaico</span>
        </div>
      </section>

      {/* ===================== VALUE ===================== */}
      <section className="sec wrap" id="funciones">
        <div className="sec-head">
          <span className="eyebrow">Por qué Hilonova</span>
          <h2>Lo que un taller necesita, sin lo que estorba.</h2>
          <p>Hecho con patronistas y supervisores de maquila. Cada función resuelve algo real del piso de producción.</p>
        </div>
        <div className="value">
          <div className="vcard feature">
            <div className="vic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h12M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div className="vbig">1 flujo</div>
            <h3>De la medida al DXF</h3>
            <p>Mete medidas y el sistema dibuja el bloque con reglas reales de patronaje. Lo afinas con curvas, pinzas y piquetes de precisión.</p>
          </div>
          <div className="vcard">
            <div className="vic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20 20 4M9 20 20 9M14 20 20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <h3>Graduación por reglas</h3>
            <p>Define los deltas una vez y obtén el nido de tallas completo, de la 28 a la 44, fiel en toda la escala.</p>
          </div>
          <div className="vcard">
            <div className="vic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" /><path d="M6 10h3v4H6z" fill="currentColor" /></svg>
            </div>
            <h3>Trazo y consumo</h3>
            <p>Acomoda al ancho real de tu tela y mide consumo y aprovechamiento. Menos merma, costeo más fino.</p>
          </div>
        </div>
      </section>

      {/* ===================== PRENDAS ===================== */}
      <section className="sec wrap">
        <div className="cards-head">
          <div className="sec-head" style={{ margin: 0 }}>
            <span className="eyebrow">Librería de bloques</span>
            <h2>Prendas listas para arrancar.</h2>
          </div>
          <Link className="btn btn-light" href="/pricing">Ver todas</Link>
        </div>
        <div className="pcards">
          <div className="pcard">
            <img className="pc-img" src={asset("/img/pcard-pants.jpg")} alt="Pantalón denim plegado" />
            <span className="pc-tag">Bloque listo</span>
            <div className="pc-foot">
              <div>
                <h4>Pantalón denim</h4>
                <div className="meta">5 piezas · 28–44</div>
              </div>
              <div className="rate">★ base</div>
            </div>
          </div>
          <div className="pcard">
            <img className="pc-img" src={asset("/img/pcard-jacket.jpg")} alt="Jacket de mezclilla" />
            <span className="pc-tag">Bloque listo</span>
            <div className="pc-foot">
              <div>
                <h4>Jacket denim</h4>
                <div className="meta">8 piezas · S–XXL</div>
              </div>
              <div className="rate">★ base</div>
            </div>
          </div>
          <div className="pcard">
            <img className="pc-img" src={asset("/img/pcard-shirt.jpg")} alt="Camisa de chambray plegada" />
            <span className="pc-tag">Bloque listo</span>
            <div className="pc-foot">
              <div>
                <h4>Camisa chambray</h4>
                <div className="meta">6 piezas · S–XL</div>
              </div>
              <div className="rate">★ base</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SHOWCASE ===================== */}
      <section className="sec wrap">
        <div className="sec-head center">
          <span className="eyebrow">El editor</span>
          <h2>Un lienzo hecho para patronistas.</h2>
          <p>Precisión al milímetro, herramientas que entienden de prendas y el nido de tallas sobre el mismo lienzo.</p>
        </div>
        <div className="sc-card">
          <div className="sc-top">
            <div className="dots"><i /><i /><i /></div>
            <span className="t">Jean Slim · Delantero · cm</span>
            <span className="r">● DXF-AAMA listo</span>
          </div>
          <div className="sc-body">
            <div className="sc-rail">
              <div className="tool on"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3l15 7-6 2-2 6-7-15Z" fill="currentColor" /></svg></div>
              <div className="tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 19C4 10 20 14 20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></div>
              <div className="tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3 8 21M12 3l4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></div>
              <div className="tool"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M9 8l3-4 3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            </div>
            <div className="sc-canvas">
              <div className="sc-chip" style={{ left: 16, top: 16 }}>80.0 cm</div>
              <div className="sc-chip" style={{ right: 16, bottom: 16 }}>aprovechado <b>83%</b></div>
              <svg viewBox="0 0 520 420" preserveAspectRatio="xMidYMid meet" aria-label="Patrón graduado en el editor">
                <g transform="translate(150,30)">
                  <path d={PANT} transform="translate(205,170) scale(0.9) translate(-205,-170)" fill="none" stroke="#3FB5C9" strokeWidth="1.5" opacity=".7" />
                  <path d={PANT} transform="translate(205,170) scale(1.08) translate(-205,-170)" fill="none" stroke="#E07CC0" strokeWidth="1.5" opacity=".7" />
                  <path d={PANT} transform="translate(205,170) scale(1.045) translate(-205,-170)" fill="none" stroke="#3FD0C9" strokeWidth="1.3" strokeDasharray="6 4" />
                  <path d={PANT} fill="rgba(240,102,44,.05)" stroke="#EAF2FF" strokeWidth="2.4" strokeLinejoin="round" />
                  <line x1="150" y1="92" x2="150" y2="360" stroke="#F0662C" strokeWidth="2" />
                  <g fill="#0b1222" stroke="#3FD0C9" strokeWidth="2">
                    <circle cx="96" cy="44" r="4" />
                    <circle cx="208" cy="52" r="4" />
                    <circle cx="198" cy="420" r="4" />
                    <circle cx="120" cy="420" r="4" />
                  </g>
                  <rect x="203" y="47" width="10" height="10" fill="#F0662C" stroke="#0b1222" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
            <div className="sc-panel">
              <div className="lab">Pieza · Delantero</div>
              <div className="sc-field"><span>Cantidad</span><span className="v">×2</span></div>
              <div className="sc-field"><span>Margen</span><span className="v">1.0 cm</span></div>
              <div className="sc-field"><span>Hilo</span><span className="v">0°</span></div>
              <div className="lab" style={{ marginTop: 18 }}>Nido de tallas</div>
              <div className="sc-sizes">
                <span style={{ background: "#3FD0C9" }}>28</span>
                <span style={{ background: "#5BC8E8" }}>30</span>
                <span style={{ background: "#F0662C", color: "#fff" }}>32</span>
                <span style={{ background: "#E0A33C" }}>34</span>
                <span style={{ background: "#E07CC0" }}>36</span>
              </div>
            </div>
          </div>
        </div>
        <div className="sc-feats">
          <div className="sc-feat"><div className="fi"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19C4 10 20 14 20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></div><h4>Curvas Bézier</h4><p>Líneas finas con manejadores, no polilíneas toscas.</p></div>
          <div className="sc-feat"><div className="fi"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M4 9h16M9 4v16" stroke="currentColor" strokeWidth="1.1" /></svg></div><h4>Snapping fino</h4><p>Enganche al milímetro con cotas en vivo.</p></div>
          <div className="sc-feat"><div className="fi"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 10a8 8 0 1 1 2 6M4 10V5M4 10h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h4>Undo infinito</h4><p>Pruebas y vuelves atrás sin perder trabajo.</p></div>
          <div className="sc-feat"><div className="fi"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M4 12l8 4 8-4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg></div><h4>Capas por rol</h4><p>Corte, costura, hilo y guías por separado.</p></div>
        </div>
      </section>

      {/* ===================== VIDEOS EN ACCIÓN ===================== */}
      <section className="sec wrap">
        <div className="sec-head center">
          <span className="eyebrow">En movimiento</span>
          <h2>Hilonova, en acción.</h2>
          <p>De la marca al patrón, del patrón a la graduación. Lo que haces en el software, en video.</p>
        </div>

        {/* brand reveal grande, abridor cinematográfico */}
        <div className="vhero">
          <video src={asset("/video/v-logo-reveal.mp4")} autoPlay muted loop playsInline preload="metadata" />
          <span className="vtag">La marca</span>
          <div className="vcap">
            <div>
              <h3>Hilonova, hilo tras hilo.</h3>
              <p>Mezclilla que se vuelve marca. El origen de todo lo que sigue.</p>
            </div>
          </div>
        </div>

        {/* 3 videos de "ingredientes" del flujo */}
        <div className="vgrid">
          <div className="vcell">
            <video src={asset("/video/v-pattern.mp4")} autoPlay muted loop playsInline preload="metadata" />
            <span className="vtag">01 · Patrón</span>
            <div className="vcap">
              <div>
                <h4>Nace del dato</h4>
                <div className="meta">Reglas reales de patronaje</div>
              </div>
            </div>
          </div>
          <div className="vcell">
            <video src={asset("/video/v-grading.mp4")} autoPlay muted loop playsInline preload="metadata" />
            <span className="vtag">02 · Graduación</span>
            <div className="vcap">
              <div>
                <h4>Una regla, todas las tallas</h4>
                <div className="meta">Nido de la 28 a la 44</div>
              </div>
            </div>
          </div>
          <div className="vcell">
            <video src={asset("/video/v-trazo.mp4")} autoPlay muted loop playsInline preload="metadata" />
            <span className="vtag">03 · Las piezas</span>
            <div className="vcap">
              <div>
                <h4>Un pantalón, todas sus piezas</h4>
                <div className="meta">La anatomía completa de la prenda</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CONTEXT (foto) ===================== */}
      <section className="sec wrap">
        <div className="ctx-grid">
          <div className="ctx-photo">
            <img src={asset("/img/contexto.jpg")} alt="Supervisor usando Hilonova en un atelier de confección" />
            <div className="ctx-pin p1">
              <div className="pic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H4zM8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              Corre en el navegador
              <small style={{ marginLeft: 4 }}>sin instalar nada</small>
            </div>
            <div className="ctx-pin p2">
              <div className="pic" style={{ background: "var(--accent)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              DXF enviado
              <small style={{ marginLeft: 4 }}>a la maquila</small>
            </div>
          </div>
          <div>
            <span className="eyebrow">En el taller</span>
            <h2 style={{ fontSize: "clamp(28px,3.8vw,44px)", marginTop: 14 }}>
              Del escritorio del patronista al piso de corte.
            </h2>
            <p style={{ color: "var(--ink-2)", fontSize: 17, lineHeight: 1.6, marginTop: 16, maxWidth: "42ch" }}>
              El patronista diseña, el supervisor revisa el consumo y la maquila recibe el DXF —
              todos mirando la misma verdad, desde el equipo que ya tienen.
            </p>
            <ul className="ctx-list">
              <li><Check size={20} /> Sin instalar nada, desde cualquier equipo</li>
              <li><Check size={20} /> Roles para patronista, producción y administración</li>
              <li><Check size={20} /> Una sola fuente, del diseño a la entrega</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== STEPS ===================== */}
      <section className="sec wrap" id="flujo">
        <div className="sec-head center">
          <span className="eyebrow">Así de simple</span>
          <h2>De la idea al corte en 3 pasos.</h2>
        </div>
        <div className="steps">
          <div className="stepc"><div className="num">1</div><h3>Mete las medidas</h3><p>Cintura, cadera, tiro y largo. El sistema dibuja el bloque base al instante.</p></div>
          <div className="stepc"><div className="num">2</div><h3>Ajusta y gradúa</h3><p>Afina las curvas y genera el nido de tallas completo con tus reglas.</p></div>
          <div className="stepc"><div className="num">3</div><h3>Traza y exporta</h3><p>Optimiza el trazo y manda DXF-AAMA o PDF directo a tu maquila.</p></div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section className="sec wrap" id="precios">
        <div className="sec-head center">
          <span className="eyebrow">Precios</span>
          <h2>Un plan por cada tamaño de taller.</h2>
          <p>Empieza en minutos, crece cuando lo necesites. Sin instalación, sin contratos atados.</p>
        </div>
        <div className="pricing">
          <div className="plan">
            <h3>Taller</h3>
            <div className="pd">Para el patronista independiente y talleres chicos.</div>
            <div className="price"><span className="amt mono">$490</span><span className="per">/ mes</span></div>
            <div className="note">MXN · mensual</div>
            <button className="pcta out">Empezar</button>
            <ul className="feats">
              <li><Check /> 2 usuarios</li>
              <li><Check /> Patrones ilimitados</li>
              <li><Check /> Export PDF y plotter</li>
            </ul>
          </div>
          <div className="plan pop">
            <span className="badge">El más usado</span>
            <h3>Maquila</h3>
            <div className="pd">Para talleres en producción constante.</div>
            <div className="price"><span className="amt mono">$1,290</span><span className="per">/ mes</span></div>
            <div className="note">MXN · anual: 2 meses gratis</div>
            <button className="pcta fill">Crear cuenta</button>
            <ul className="feats">
              <li><Check /> 8 usuarios con roles</li>
              <li><Check /> Export DXF-AAMA</li>
              <li><Check /> Graduación completa</li>
              <li><Check /> Trazo y fichas técnicas</li>
            </ul>
          </div>
          <div className="plan">
            <h3>Industrial</h3>
            <div className="pd">Para maquilas grandes y marcas con varias líneas.</div>
            <div className="price"><span className="amt">A medida</span></div>
            <div className="note">Hablemos de tu operación</div>
            <button className="pcta out">Contactar ventas</button>
            <ul className="feats">
              <li><Check /> Usuarios ilimitados</li>
              <li><Check /> SSO corporativo</li>
              <li><Check /> Soporte y API</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIAL =====================
          PENDIENTE DE REEMPLAZAR POR TESTIMONIO REAL de piloto. El actual
          es contenido de muestra para evaluar maquetación: no citar como
          cliente real hasta tener autorización por escrito del taller. */}
      <section className="sec wrap">
        <div className="quote">
          <div className="ph">
            <img src={asset("/img/testimonio.jpg")} alt="Patronista en taller de mezclilla revisando una graduación impresa" />
          </div>
          <blockquote>
            <span className="eyebrow" style={{ marginBottom: 14 }}>● Piloto en pruebas</span>
            <p>
              “Antes graduar de la 28 a la 44 nos tomaba una tarde completa a mano,
              y cada corrida le dejaba un dolor de cabeza al cortador. Con Hilonova
              bajamos la merma unos puntos y entregamos el DXF listo para Gerber el
              mismo día: la gente de corte deja de rehacer y vuelve a confiar en el
              trazo.”
            </p>
            <div className="who">
              <b>Taller piloto · Torreón</b> · nombre y cargo por confirmar
            </div>
          </blockquote>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="sec wrap">
        <div className="cta-band">
          <h2>Lleva tu patronaje al estándar de la industria.</h2>
          <p>Diseña, gradúa y traza en un solo lugar, y entrega a tu maquila justo lo que necesita.</p>
          <div className="hero-cta center">
            <Link className="btn btn-accent" href="/auth/signup">
              Crear cuenta
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link className="btn btn-ghost" href="/studio">Ver el editor</Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="brand">
                <BrandMark className="mk mk-dark" />
                hilonova
              </div>
              <p>Software de patronaje digital para maquilas y talleres de confección.</p>
              <div className="contact">
                <span>WhatsApp · 236 120 7101</span>
                <span>Facebook · HiloNova</span>
              </div>
            </div>
            <div className="foot-col">
              <h4>Producto</h4>
              <a href="#funciones">Funciones</a>
              <a href="#flujo">Flujo</a>
              <a href="#precios">Precios</a>
              <Link href="/studio">Editor</Link>
            </div>
            <div className="foot-col" id="recursos">
              <h4>Recursos</h4>
              <a href="#">Guías</a>
              <a href="#">DXF-AAMA</a>
              <a href="#">Soporte</a>
            </div>
            <div className="foot-col">
              <h4>Empresa</h4>
              <a href="#">Hilonova</a>
              <a href="#">Contacto</a>
              <a href="#">Blog</a>
            </div>
            <div className="foot-col">
              <h4>Legal</h4>
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
            </div>
          </div>
          <div className="foot-bar">
            <span>© {new Date().getFullYear()} Hilonova · Hecho en México 🇲🇽</span>
            <span className="mono">Patronaje digital para maquila · B2B</span>
          </div>
        </div>
      </footer>
    </>
  );
}
