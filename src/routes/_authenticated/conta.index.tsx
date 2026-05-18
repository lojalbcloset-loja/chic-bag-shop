import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile } from "@/lib/account.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/conta/")({
  head: () => ({ meta: [{ title: "Meus dados — Lb Closet" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const getProfile = useServerFn(getMyProfile);
  const updateProfile = useServerFn(updateMyProfile);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const [form, setForm] = useState({
    full_name: "", phone: "", cpf: "", birth_date: "", accepts_marketing: false,
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        full_name: data.profile.full_name ?? "",
        phone: data.profile.phone ?? "",
        cpf: data.profile.cpf ?? "",
        birth_date: data.profile.birth_date ?? "",
        accepts_marketing: !!data.profile.accepts_marketing,
      });
    }
  }, [data]);

  const m = useMutation({
    mutationFn: (payload: typeof form) => updateProfile({ data: payload }),
    onSuccess: () => {
      toast.success("Dados atualizados");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meus dados</h1>
        <p className="text-sm text-muted-foreground">{data?.email}</p>
      </div>
      <form className="grid gap-4 max-w-xl"
        onSubmit={(e) => { e.preventDefault(); m.mutate(form); }}>
        <Field label="Nome completo">
          <Input required value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone">
            <Input value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="CPF">
            <Input value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          </Field>
        </div>
        <Field label="Data de nascimento">
          <Input type="date" value={form.birth_date ?? ""}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.accepts_marketing}
            onCheckedChange={(v) => setForm({ ...form, accepts_marketing: !!v })} />
          Quero receber novidades e promoções por e-mail
        </label>
        <div>
          <Button type="submit" disabled={m.isPending}>
            {m.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
