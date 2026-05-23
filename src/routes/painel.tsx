import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoUrl from "@/assets/images/logo/logo-lbcloset-oficial.png";

export const Route = createFileRoute("/painel")({
  component: PainelLoginPage,
  head: () => ({
    meta: [
      { title: "Painel — LB Closet" },
      { name: "description", content: "Acesso ao painel administrativo da LB Closet." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function PainelLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate({ to: "/admin" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vinda!");
    navigate({ to: "/admin" });
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/40">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 mb-8">
              <img
                src={logoUrl}
                alt="LB Closet"
                className="h-16 w-auto object-contain"
              />
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                Entre com suas credenciais para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="painel-email">E-mail</Label>
                <Input
                  id="painel-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="painel-pass">Senha</Label>
                <Input
                  id="painel-pass"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium !bg-[#3F2424] hover:!bg-[#694141]"
                disabled={loading}
              >
                {loading ? "Entrando…" : "Entrar"}
              </Button>

              <button
                type="button"
                className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                onClick={async () => {
                  if (!email) {
                    toast.error("Informe o e-mail primeiro");
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Verifique seu e-mail");
                }}
              >
                Esqueceu sua senha?
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © Todos os Direitos Reservados 2026
      </footer>
    </main>
  );
}
