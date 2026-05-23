import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: CategoriasPage,
});

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,is_active,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Category[];
}

function CategoriasPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: fetchCategories });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const create = async () => {
    if (!form.name.trim()) return toast.error("Informe o nome");
    const slug = form.slug || slugify(form.name);
    const { error } = await supabase.from("categories").insert({ name: form.name.trim(), slug });
    if (error) return toast.error(error.message);
    toast.success("Categoria criada");
    setOpen(false);
    setForm({ name: "", slug: "" });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const toggleActive = async (c: Category) => {
    const { error } = await supabase.from("categories").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize o catálogo em coleções</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="!bg-[#3F2424] hover:!bg-[#694141]">
              <Plus className="h-4 w-4 mr-1" /> Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  placeholder={form.name ? slugify(form.name) : "ex: vestidos"}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={create} className="!bg-[#3F2424] hover:!bg-[#694141]">Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Slug</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma categoria.</td></tr>
            )}
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs px-2 py-1 rounded-full ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                  >
                    {c.is_active ? "Ativa" : "Inativa"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c.id)} className="text-destructive hover:bg-destructive/10 rounded p-1.5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
