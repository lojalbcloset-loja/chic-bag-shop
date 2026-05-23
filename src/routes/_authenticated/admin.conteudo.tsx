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

export const Route = createFileRoute("/_authenticated/admin/conteudo")({
  component: ConteudoPage,
});

type Slide = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  is_active: boolean;
};

async function fetchSlides() {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Slide[];
}

function ConteudoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-slides"], queryFn: fetchSlides });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    image_url: "", title: "", subtitle: "", cta_label: "", cta_href: "",
  });

  const create = async () => {
    if (!form.image_url.trim()) return toast.error("URL da imagem é obrigatória");
    const { error } = await supabase.from("hero_slides").insert({
      image_url: form.image_url.trim(),
      title: form.title || null,
      subtitle: form.subtitle || null,
      cta_label: form.cta_label || null,
      cta_href: form.cta_href || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Banner criado");
    setOpen(false);
    setForm({ image_url: "", title: "", subtitle: "", cta_label: "", cta_href: "" });
    qc.invalidateQueries({ queryKey: ["admin-slides"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-slides"] });
  };

  const toggleActive = async (s: Slide) => {
    const { error } = await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-slides"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Banners e sliders da loja</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="!bg-[#3F2424] hover:!bg-[#694141]">
              <Plus className="h-4 w-4 mr-1" /> Novo banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo banner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>URL da imagem</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Texto do botão</Label>
                  <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Link do botão</Label>
                  <Input value={form.cta_href} onChange={(e) => setForm({ ...form, cta_href: e.target.value })} placeholder="/loja" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={create} className="!bg-[#3F2424] hover:!bg-[#694141]">Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Carregando…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-muted-foreground col-span-full">Nenhum banner cadastrado.</p>
        )}
        {(data ?? []).map((s) => (
          <div key={s.id} className="rounded-xl border bg-card overflow-hidden flex flex-col">
            <div className="aspect-video bg-muted relative">
              {s.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image_url} alt={s.title ?? ""} className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              <div className="font-medium text-sm truncate">{s.title || "—"}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{s.subtitle || ""}</div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs px-2 py-1 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                >
                  {s.is_active ? "Ativo" : "Inativo"}
                </button>
                <button onClick={() => remove(s.id)} className="text-destructive hover:bg-destructive/10 rounded p-1.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
