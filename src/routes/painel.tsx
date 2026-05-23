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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate({ to: "/admin" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Bem-vinda!");
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/painel`,
          data: { full_name: fullName },
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Cadastro realizado! Verifique seu e-mail se necessário.");
      setMode("login");
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/40">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 mb-8">
              <img src={logoUrl} alt="LB Closet" className="h-16 w-auto object-contain" />
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                {mode === "login"
                  ? "Entre com suas credenciais para continuar"
                  : "Crie sua conta de acesso ao painel"}
              </p>
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 text-sm py-2 rounded-md transition-colors ${
                  mode === "login" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 text-sm py-2 rounded-md transition-colors ${
                  mode === "signup" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="painel-name">Nome</Label>
                  <Input
                    id="painel-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="h-11"
                  />
                </div>
              )}

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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
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
                {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>

              {mode === "login" && (
                <button
                  type="button"
                  className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  onClick={async () => {
                    if (!email) return toast.error("Informe o e-mail primeiro");
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) toast.error(error.message);
                    else toast.success("Verifique seu e-mail");
                  }}
                >
                  Esqueceu sua senha?
                </button>
              )}
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

