"use client";

import LegalPage, { Todo } from "./LegalPage";

export default function PrivacidadContent() {
  return (
    <LegalPage title="Aviso de privacidad">
      <p className="legal-date">
        Última actualización: <Todo>fecha de publicación</Todo>
      </p>

      <h2>1. Quién es el responsable de tus datos</h2>
      <p>
        El responsable del tratamiento de tus datos personales es <Todo>razón social o nombre de la persona responsable</Todo>,
        con domicilio en <Todo>domicilio completo</Todo>. Para cualquier asunto sobre tus datos puedes escribir
        a <Todo>correo de contacto para datos personales</Todo>.
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
          <b>Tus patrones y medidas:</b> hoy se guardan en tu propio navegador. Cuando esté disponible el guardado en la nube,
          se guardarán también en nuestros servidores asociados a tu cuenta.{" "}
          <Todo>revisar este punto cuando se active el guardado en la nube</Todo>
        </li>
        <li>
          <b>Datos de pago:</b> <Todo>completar cuando exista el cobro: quién lo procesa y qué datos guarda cada parte</Todo>
        </li>
      </ul>
      <p>No recabamos datos personales sensibles.</p>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y darte acceso al programa.</li>
        <li>Enviarte los correos del servicio: verificación de tu correo y cambio de contraseña.</li>
        <li>Darte soporte cuando lo pidas.</li>
        <li>Mantener la seguridad de las cuentas y evitar usos indebidos.</li>
        <li>
          <Todo>cobrar el plan y emitir comprobantes, cuando exista el cobro</Todo>
        </li>
      </ul>
      <p>
        <Todo>decidir si se enviarán novedades o promociones por correo; si no, dejar esta línea fuera</Todo>
      </p>

      <h2>4. Con quién compartimos tus datos</h2>
      <p>
        No vendemos tus datos. Usamos proveedores para operar el servicio: <b>Google (Firebase)</b> para las cuentas y el
        almacenamiento. <Todo>agregar al proveedor de pagos cuando exista el cobro</Todo> Estos proveedores tratan los datos
        solo para prestarnos el servicio. Fuera de ellos, solo compartiremos datos si una autoridad competente nos lo exige.
      </p>

      <h2>5. Tus derechos (acceso, rectificación, cancelación y oposición)</h2>
      <p>
        Puedes pedir en cualquier momento que te digamos qué datos tuyos tenemos, que los corrijamos, que los borremos o que
        dejemos de usarlos. Escribe a <Todo>correo de contacto para datos personales</Todo> desde el correo de tu cuenta,
        indicando qué solicitas. Te responderemos en los plazos que marca la ley.
      </p>

      <h2>6. Almacenamiento en tu navegador</h2>
      <p>
        El programa usa el almacenamiento de tu navegador para mantener tu sesión y guardar tus patrones. No usamos
        publicidad ni herramientas de rastreo de terceros.{" "}
        <Todo>revisar si se agrega alguna herramienta de estadísticas antes de publicar</Todo>
      </p>

      <h2>7. Cambios a este aviso</h2>
      <p>
        Si cambiamos este aviso lo publicaremos en esta página con la nueva fecha. <Todo>definir si además se avisará por correo</Todo>
      </p>
    </LegalPage>
  );
}
