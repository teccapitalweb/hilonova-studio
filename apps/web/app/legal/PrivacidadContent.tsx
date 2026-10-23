"use client";

import LegalPage from "./LegalPage";

export default function PrivacidadContent() {
  return (
    <LegalPage title="Aviso de privacidad">
      <p className="legal-date">Última actualización: 23 de octubre de 2026</p>

      <h2>1. Quién es el responsable de tus datos</h2>
      <p>
        HiloNova es el responsable del tratamiento de los datos personales que nos das al usar HiloNova Studio. Para
        cualquier asunto sobre tus datos puedes escribirnos por los medios de contacto que HiloNova publica en su sitio.
      </p>

      <h2>2. Qué datos recabamos</h2>
      <ul>
        <li><b>Datos de tu cuenta:</b> nombre, correo electrónico y, si lo escribes, el nombre de tu taller.</li>
        <li>
          <b>Tu contraseña:</b> la procesa y guarda el servicio de autenticación (Firebase, de Google) de forma protegida.
          Nosotros no la vemos ni la conocemos.
        </li>
        <li>
          <b>Si entras con Google:</b> el nombre y el correo que Google comparte con nosotros. No recibimos tu contraseña de Google.
        </li>
        <li>
          <b>Tus patrones y medidas:</b> se guardan en tu navegador y también en nuestros servidores (Firebase, de
          Google), asociados a tu cuenta, para que puedas abrirlos desde otra computadora. Puedes borrarlos desde el
          programa. Los materiales, las piezas guardadas y tus preferencias se guardan solo en tu navegador.
        </li>
        <li>
          <b>Datos de pago:</b> hoy no los pedimos. Cuando exista el cobro lo procesará un proveedor de pagos y
          actualizaremos este aviso.
        </li>
      </ul>
      <p>No recabamos datos personales sensibles.</p>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y darte acceso al programa.</li>
        <li>Enviarte los correos del servicio: verificación de tu correo y cambio de contraseña.</li>
        <li>Darte soporte cuando lo pidas.</li>
        <li>Mantener la seguridad de las cuentas y evitar usos indebidos.</li>
      </ul>
      <p>No usamos tus datos para enviarte publicidad.</p>

      <h2>4. Con quién compartimos tus datos</h2>
      <p>
        No vendemos tus datos. Usamos a <b>Google (Firebase)</b> para las cuentas y el almacenamiento. Este proveedor trata
        los datos solo para prestarnos el servicio. Fuera de él, solo compartiremos datos si una autoridad competente nos
        lo exige.
      </p>

      <h2>5. Tus derechos (acceso, rectificación, cancelación y oposición)</h2>
      <p>
        Puedes pedir en cualquier momento que te digamos qué datos tuyos tenemos, que los corrijamos, que los borremos o que
        dejemos de usarlos. Escríbenos desde el correo de tu cuenta indicando qué solicitas. Te responderemos en los plazos
        que marca la ley.
      </p>

      <h2>6. Almacenamiento en tu navegador</h2>
      <p>
        El programa usa el almacenamiento de tu navegador para mantener tu sesión y guardar tus patrones. No usamos
        publicidad ni herramientas de rastreo de terceros.
      </p>

      <h2>7. Cambios a este aviso</h2>
      <p>Si cambiamos este aviso lo publicaremos en esta página con la nueva fecha.</p>
    </LegalPage>
  );
}
