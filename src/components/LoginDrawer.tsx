import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useShop } from "@/store/shop";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function LoginDrawer() {
  const open = useShop((s) => s.loginOpen);
  const setOpen = useShop((s) => s.setLoginOpen);
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <aside className={`login-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <header>
        <strong>{isAuthenticated ? "Minha conta" : "Acessar"}</strong>
        <button type="button" aria-label="Fechar" onClick={() => setOpen(false)}>×</button>
      </header>

      <div className="p-4">
        {isAuthenticated ? (
          <AuthenticatedView email={user?.email ?? ""} onSignOut={async () => {
            await signOut();
            toast.success("Você saiu da conta");
            setOpen(false);
          }} closeDrawer={() => setOpen(false)} />
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-4">
              <SignInForm onSuccess={() => setOpen(false)} />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <SignUpForm onSuccess={() => setOpen(false)} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </aside>
  );
}

function AuthenticatedView({
  email, onSignOut, closeDrawer,
}: { email: string; onSignOut: () => void; closeDrawer: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Conectada como</p>
      <p className="font-medium">{email}</p>
      <div className="grid gap-2">
        <Button asChild variant="outline" onClick={closeDrawer}>
          <Link to="/conta">Meus dados</Link>
        </Button>
        <Button asChild variant="outline" onClick={closeDrawer}>
          <Link to="/conta/pedidos">Meus pedidos</Link>
        </Button>
        <Button asChild variant="outline" onClick={closeDrawer}>
          <Link to="/conta/enderecos">Endereços</Link>
        </Button>
        <Button variant="ghost" onClick={onSignOut}>Sair</Button>
      </div>
    </div>
  );
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success("Bem-vinda!");
        onSuccess();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="si-email">E-mail</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="si-pass">Senha</Label>
        <Input id="si-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
      <button
        type="button"
        className="block text-xs text-muted-foreground underline mx-auto"
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
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success("Cadastro feito! Verifique seu e-mail.");
        onSuccess();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Nome completo</Label>
        <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">E-mail</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pass">Senha</Label>
        <Input id="su-pass" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  );
}
