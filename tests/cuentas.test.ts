// Cuentas: mensajes de error en español y armado de la sesión a partir de la cuenta de Firebase.

import { describe, expect, it } from "vitest";
import { authErrorCode, authErrorMessage } from "../apps/web/app/lib/auth-errors";
import { defaultOrgName, sessionFromAccount, type AccountUser } from "../apps/web/app/lib/auth";

const account = (over: Partial<AccountUser> = {}): AccountUser => ({
  uid: "abc123",
  email: "ana.lopez@taller.mx",
  displayName: null,
  emailVerified: false,
  createdAt: "2026-10-23T12:00:00.000Z",
  ...over,
});

describe("mensajes de error de cuentas", () => {
  it.each([
    ["auth/email-already-in-use", /Ya existe una cuenta/],
    ["auth/invalid-credential", /incorrectos/],
    ["auth/wrong-password", /incorrectos/],
    ["auth/user-not-found", /incorrectos/],
    ["auth/weak-password", /8 caracteres/],
    ["auth/too-many-requests", /Demasiados intentos/],
    ["auth/network-request-failed", /conexión/],
  ])("%s se explica en español", (code, re) => {
    expect(authErrorMessage({ code })).toMatch(re);
  });

  it("un correo o contraseña mal puestos no dicen cuál de los dos falló", () => {
    expect(authErrorMessage({ code: "auth/user-not-found" })).toBe(authErrorMessage({ code: "auth/wrong-password" }));
  });

  it("cerrar la ventana de Google no es un error que mostrar", () => {
    expect(authErrorMessage({ code: "auth/popup-closed-by-user" })).toBe("");
    expect(authErrorMessage({ code: "auth/cancelled-popup-request" })).toBe("");
  });

  it("un error desconocido da un mensaje genérico, sin código técnico", () => {
    const m = authErrorMessage({ code: "auth/algo-raro" });
    expect(m).toMatch(/Inténtalo de nuevo/);
    expect(m).not.toContain("auth/");
    expect(authErrorMessage(new Error("boom"))).toMatch(/Inténtalo de nuevo/);
    expect(authErrorCode("texto")).toBe("");
  });
});

describe("sesión a partir de la cuenta", () => {
  it("usa el nombre y el taller del perfil", () => {
    const s = sessionFromAccount(account(), { name: "Ana López", orgName: "Confecciones Luna" });
    expect(s.user).toEqual({ id: "abc123", name: "Ana López", email: "ana.lopez@taller.mx", emailVerified: false });
    expect(s.org.name).toBe("Confecciones Luna");
    expect(s.org.id).toBe("org_abc123");
  });

  it("sin perfil usa el nombre de la cuenta y, si no hay, el del correo", () => {
    expect(sessionFromAccount(account({ displayName: "Ana L." })).user.name).toBe("Ana L.");
    expect(sessionFromAccount(account()).user.name).toBe("ana lopez");
  });

  it("sin nombre de taller propone uno a partir del nombre", () => {
    expect(sessionFromAccount(account(), { name: "Ana López" }).org.name).toBe(defaultOrgName("Ana López"));
    expect(defaultOrgName("Ana López")).toBe("Ana de López");
  });

  it("todas las cuentas reciben hoy el plan único con 1 usuario", () => {
    const s = sessionFromAccount(account());
    expect(s.org.plan).toBe("completo");
    expect(s.org.seats).toBe(1);
  });

  it("«desde» es la fecha del perfil, o la de creación de la cuenta", () => {
    expect(sessionFromAccount(account(), { createdAt: "2026-01-01T00:00:00.000Z" }).since).toBe("2026-01-01T00:00:00.000Z");
    expect(sessionFromAccount(account()).since).toBe("2026-10-23T12:00:00.000Z");
  });

  it("refleja si el correo ya se verificó", () => {
    expect(sessionFromAccount(account({ emailVerified: true })).user.emailVerified).toBe(true);
  });
});
