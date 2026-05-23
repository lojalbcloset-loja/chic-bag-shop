import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2, ImageIcon, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/conteudo")({
  component: ConteudoPage,
});

type Slide = {
  id: string;
  image_url: string;
  title: string | null;
  cta_href: string | null;
  sort_order: number;
  is_active: boolean;
};

const MAX_SLIDES = 7;

async function fetchSlides() {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id,image_url,title,cta_href,sort_order,is_active")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Slide[];
}

function ConteudoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-slides"], queryFn: fetchSlides });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [sortOrder, setSortOrder] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = data?.length ?? 0;
  const reachedLimit = total >= MAX_SLIDES;

  const reset = () => {
    setEditing(null);
    setImageUrl("");
    setName("");
    setCtaHref("");
    setSortOrder("");
    setIsActive(true);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => {
    if (reachedLimit) return toast.error(`Limite de ${MAX_SLIDES} banners atingido`);
    reset();
    setSortOrder(total + 1);
    setOpen(true);
  };

  const openEdit = (s: Slide) => {
    setEditing(s);
    setImageUrl(s.image_url);
    setName(s.title ?? "");
    setCtaHref(s.cta_href ?? "");
    setSortOrder(s.sort_order);
    setIsActive(s.is_active);
    setOpen(true);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Selecione um arquivo de imagem");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      setImageUrl(pub.publicUrl);
      toast.success("Imagem carregada");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!imageUrl) return toast.error("Carregue uma imagem");
    if (!name.trim()) return toast.error("Informe o nome do banner");
    const payload = {
      image_url: imageUrl,
      title: name.trim(),
      cta_href: ctaHref.trim() || null,
      sort_order: typeof sortOrder === "number" ? sortOrder : total + 1,
      is_active: isActive,
    };
    if (editing) {
      const { error } = await supabase.from("hero_slides").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Banner atualizado");
    } else {
      if (reachedLimit) return toast.error(`Limite de ${MAX_SLIDES} banners atingido`);
      const { error } = await supabase.from("hero_slides").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Banner criado");
    }
    setOpen(false);
    reset();
    qc.invalidateQueries({ queryKey: ["admin-slides"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-slides"] });
  };

  const toggleActive = async (s: Slide, value: boolean) => {
    const { error } = await supabase.from("hero_slides").update({ is_active: value }).eq("id", s.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-slides"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Slider-Banners</h1>
          <p className="text-sm text-muted-foreground">
            Banners do carrossel da loja · {total}/{MAX_SLIDES}
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              disabled={reachedLimit}
              className="!bg-[#3F2424] hover:!bg-[#694141]"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar banner" : "Novo banner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Imagem do banner</Label>
                <p className="text-xs text-muted-foreground">Dimensões recomendadas: 1920×670px</p>
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition cursor-pointer"
                  style={{ aspectRatio: "1920 / 670" }}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Pré-visualização" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      {uploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-sm">Enviando…</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-sm font-medium">Clique para carregar</span>
                          <span className="text-xs">1920×670px · JPG, PNG ou WEBP</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                {imageUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-1" /> Trocar imagem
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_SLIDES}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do banner</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Coleção Verão 2026"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Link de redirecionamento</Label>
                <Input
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="/loja ou https://..."
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm">Ativar slider-banner</Label>
                  <p className="text-xs text-muted-foreground">Quando desativado, não aparece na loja</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={save}
                disabled={!imageUrl || uploading}
                className="!bg-[#3F2424] hover:!bg-[#694141]"
              >
                {editing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-20">ORDEM</TableHead>
              <TableHead className="w-28">PRÉVIA</TableHead>
              <TableHead>NOME DO BANNER</TableHead>
              <TableHead>LINK</TableHead>
              <TableHead className="w-28 text-center">ATIVO</TableHead>
              <TableHead className="w-28 text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Carregando…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Nenhum banner cadastrado.
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.sort_order}</TableCell>
                <TableCell>
                  <div className="w-20 h-10 rounded overflow-hidden bg-muted">
                    {s.image_url && (
                      <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{s.title || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[220px]">
                  {s.cta_href || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s, v)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1.5"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-destructive hover:bg-destructive/10 rounded p-1.5"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
