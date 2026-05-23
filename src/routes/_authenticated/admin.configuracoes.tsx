import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("full_name,phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
        setLoading(false);
      });
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone });
    setSaving(false);
    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil atualizado");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Seus dados como administrador da loja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input id="profile-email" type="email" value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Telefone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={saveProfile}
              disabled={saving || loading}
              className="!bg-[#3F2424] hover:!bg-[#694141]"
            >
              {saving ? "Salvando…" : "Salvar perfil"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loja</CardTitle>
          <CardDescription>Informações básicas da loja exibidas no site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nome da loja</Label>
              <Input id="store-name" defaultValue="LB Closet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">E-mail de contato</Label>
              <Input id="store-email" type="email" defaultValue="contato@lbcloset.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades</CardTitle>
          <CardDescription>Ative ou desative recursos da loja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aceitar novos pedidos</p>
              <p className="text-xs text-muted-foreground">Permitir que clientes finalizem compras.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cadastro de novos usuários</p>
              <p className="text-xs text-muted-foreground">Permitir que novos clientes se cadastrem.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo de manutenção</p>
              <p className="text-xs text-muted-foreground">Exibe uma página de manutenção no site.</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="!bg-[#3F2424] hover:!bg-[#694141]">Salvar alterações</Button>
      </div>
    </div>
  );
}
