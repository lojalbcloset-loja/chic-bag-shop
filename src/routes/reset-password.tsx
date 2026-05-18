import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Lb Closet" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const { error } = await supabase.auth.updateUser({ password });
          setLoading(false);
          if (error) return toast.error(error.message);
          toast.success("Senha redefinida");
          navigate({ to: "/" });
        }}
      >
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="new-pass">Nova senha</Label>
          <Input id="new-pass" type="password" minLength={6} required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </main>
  );
}
