import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>

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
