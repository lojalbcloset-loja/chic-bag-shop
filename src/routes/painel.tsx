import { createFileRoute, redirect } from "@tanstack/react-router";

// Atalho público de URL para o painel administrativo.
// O gate de autenticação acontece em /_authenticated/admin.
export const Route = createFileRoute("/painel")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
