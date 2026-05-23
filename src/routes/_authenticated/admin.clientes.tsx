import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: ClientesPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

async function fetchCustomers(q: string) {
  // Excluir staff (admin/manager) — clientes só são quem comprou na loja
  const { data: staff } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "manager"]);
  const staffIds = (staff ?? []).map((r) => r.user_id as string);

  // Só lista perfis que tenham ao menos 1 pedido (cadastrados no checkout)
  const { data: orderUsers, error: ordErr } = await supabase
    .from("orders")
    .select("user_id")
    .not("user_id", "is", null);
  if (ordErr) throw ordErr;
  const customerIds = Array.from(
    new Set((orderUsers ?? []).map((o) => o.user_id as string).filter((id) => !staffIds.includes(id))),
  );
  if (customerIds.length === 0) return [] as Profile[];

  let query = supabase
    .from("profiles")
    .select("id,full_name,phone,created_at")
    .in("id", customerIds)
    .order("created_at", { ascending: false })
    .limit(300);
  if (q) query = query.ilike("full_name", `%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Profile[];
}

function ClientesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-customers", search], queryFn: () => fetchCustomers(search) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Cadastros da loja</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome…"
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Telefone</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</td></tr>
            )}
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.full_name ?? "—"}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
