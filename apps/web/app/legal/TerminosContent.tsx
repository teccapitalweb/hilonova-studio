"use client";

import LegalPage from "./LegalPage";
import { findPlan } from "../lib/auth";
import { STUDENT_OFFER } from "../lib/oferta";

export default function TerminosContent() {
  const plan = findPlan("completo");
  return (
    <LegalPage title="Términos de uso">
      <p className="legal-date">Última actualización: 23 de octubre de 2026</p>

      <h2>1. Qué es HiloNova Studio</h2>
      <p>
        HiloNova Studio es un programa web de patronaje digital: patronaje 2D, graduación de tallas, trazo y producción
        (ficha técnica y exportación). Lo ofrece HiloNova.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Cada cuenta es para una sola persona. No la compartas.</li>
        <li>Debes dar datos verdaderos y mantener tu contraseña en secreto.</li>
        <li>Eres responsable de lo que se haga desde tu cuenta.</li>
      </ul>

      <h2>3. Plan y precio</h2>
      <p>
        Hay un solo plan, «{plan.name}»: ${plan.priceMxn?.toLocaleString("es-MX")} MXN al mes más IVA, para {plan.seats}{" "}
        usuario. El cobro todavía no está activo; cuando lo esté, lo avisaremos antes de cobrar.
      </p>
      <p>
        <b>Alumnos de los cursos de HiloNova:</b> reciben un cupón de un solo uso que se canjea dentro de las{" "}
        {STUDENT_OFFER.redeemHours} horas siguientes a recibirlo y da {STUDENT_OFFER.freeMonths} mes de acceso completo, con
        un máximo de {STUDENT_OFFER.exports} exportaciones en total.
      </p>

      <h2>4. Cancelación y reembolsos</h2>
      <p>
        Puedes dejar de usar el servicio cuando quieras. Las condiciones para cancelar la suscripción y pedir reembolsos se
        darán a conocer antes de activar el cobro.
      </p>

      <h2>5. Tus patrones</h2>
      <p>
        Los patrones, medidas y archivos que creas son tuyos. Nos das el permiso necesario para guardarlos y mostrarlos
        dentro de tu cuenta. El programa y su diseño son de HiloNova y no se pueden copiar ni revender.
      </p>

      <h2>6. Uso adecuado</h2>
      <ul>
        <li>No intentes entrar a cuentas de otras personas ni dañar o saturar el servicio.</li>
        <li>No uses el programa para fines ilegales.</li>
        <li>Podemos suspender una cuenta que incumpla estos términos.</li>
      </ul>

      <h2>7. Lo que debes tener en cuenta</h2>
      <ul>
        <li>
          Los moldes y las medidas que genera el programa son una herramienta de apoyo. Antes de cortar tela en cantidad,
          haz siempre una prueba de costura.
        </li>
        <li>
          La exportación a DXF para otros programas de patronaje todavía está en validación: no garantizamos que abra sin
          ajustes en todos ellos.
        </li>
        <li>Hoy tus patrones se guardan en tu navegador; haz respaldos con la opción del programa.</li>
        <li>El servicio se ofrece tal como está, sin garantía de que nunca falle.</li>
      </ul>

      <h2>8. Cambios</h2>
      <p>Podemos actualizar estos términos; los cambios se publican en esta página con su fecha.</p>

      <h2>9. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de México y por los tribunales competentes de ese país.</p>
    </LegalPage>
  );
}
