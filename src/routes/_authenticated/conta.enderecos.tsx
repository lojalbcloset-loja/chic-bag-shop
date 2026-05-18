import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listMyAddresses, saveMyAddress, deleteMyAddress,
} from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta/enderecos")({
  head: () => ({ meta: [{ title: "Endereços — Lb Closet" }] }),
  component: AddressesPage,
});

type Addr = {
  id?: string; label?: string | null; recipient: string; cep: string;
  street: string; number: string; complement?: string | null;
  neighborhood: string; city: string; state: string; is_default?: boolean;
};

const empty: Addr = {
  label: "", recipient: "", cep: "", street: "", number: "",
  complement: "", neighborhood: "", city: "", state: "", is_default: false,
};

function AddressesPage() {
  const list = useServerFn(listMyAddresses);
  const save = useServerFn(saveMyAddress);
  const del = useServerFn(deleteMyAddress);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Addr | null>(null);

  const { data } = useQuery({ queryKey: ["addresses"], queryFn: () => list() });

  const saveM = useMutation({
    mutationFn: (a: Addr) => save({ data: a }),
    onSuccess: () => {
      toast.success("Endereço salvo");
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Endereço removido");
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  if (editing) {
    return (
      <AddressForm
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={(a) => saveM.mutate(a)}
        loading={saveM.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Endereços</h1>
        <Button onClick={() => setEditing(empty)}>
          <Plus className="size-4" /> Novo endereço
        </Button>
      </div>

      {!data?.addresses?.length ? (
        <p className="text-sm text-muted-foreground">Você ainda não tem endereços salvos.</p>
      ) : (
        <div className="grid gap-3">
          {data.addresses.map((a: Addr & { id: string }) => (
            <Card key={a.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  {a.label || "Endereço"} {a.is_default && (
                    <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      Padrão
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(a)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost"
                    onClick={() => delM.mutate(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{a.recipient}</p>
                <p>{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}</p>
                <p>{a.neighborhood} — {a.city}/{a.state} • CEP {a.cep}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressForm({
  initial, onCancel, onSave, loading,
}: { initial: Addr; onCancel: () => void; onSave: (a: Addr) => void; loading: boolean }) {
  const [a, setA] = useState<Addr>(initial);
  return (
    <form className="space-y-4 max-w-2xl"
      onSubmit={(e) => { e.preventDefault(); onSave(a); }}>
      <h1 className="text-2xl font-semibold">
        {a.id ? "Editar endereço" : "Novo endereço"}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <F label="Apelido (ex: Casa)"><Input value={a.label ?? ""}
          onChange={(e) => setA({ ...a, label: e.target.value })} /></F>
        <F label="Destinatário"><Input required value={a.recipient}
          onChange={(e) => setA({ ...a, recipient: e.target.value })} /></F>
        <F label="CEP"><Input required value={a.cep}
          onChange={(e) => setA({ ...a, cep: e.target.value })} /></F>
        <F label="Rua"><Input required value={a.street}
          onChange={(e) => setA({ ...a, street: e.target.value })} /></F>
        <F label="Número"><Input required value={a.number}
          onChange={(e) => setA({ ...a, number: e.target.value })} /></F>
        <F label="Complemento"><Input value={a.complement ?? ""}
          onChange={(e) => setA({ ...a, complement: e.target.value })} /></F>
        <F label="Bairro"><Input required value={a.neighborhood}
          onChange={(e) => setA({ ...a, neighborhood: e.target.value })} /></F>
        <F label="Cidade"><Input required value={a.city}
          onChange={(e) => setA({ ...a, city: e.target.value })} /></F>
        <F label="UF"><Input required maxLength={2} value={a.state}
          onChange={(e) => setA({ ...a, state: e.target.value.toUpperCase() })} /></F>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={!!a.is_default}
          onCheckedChange={(v) => setA({ ...a, is_default: !!v })} />
        Definir como endereço padrão
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label>{label}</Label>{children}</div>);
}
