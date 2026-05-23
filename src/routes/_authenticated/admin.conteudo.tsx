import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/conteudo")({
  component: ConteudoPage,
});

type Slide = {
  id: string;
  image_url: string;
  cta_href: string | null;
  sort_order: number;
  is_active: boolean;
};

async function fetchSlides() {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id,image_url,cta_href,sort_order,is_active")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Slide[];
}

function ConteudoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-slides"], queryFn: fetchSlides });
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setImageUrl("");
    setCtaHref("");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return toast.error("Selecione um arquivo de imagem");
    }
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

  const MAX_SLIDES = 7;
  const total = data?.length ?? 0;
  const reachedLimit = total >= MAX_SLIDES;

  const create = async () => {
    if (!imageUrl) return toast.error("Carregue uma imagem");
    if (reachedLimit) return toast.error(`Limite de ${MAX_SLIDES} banners atingido`);
    const { error } = await supabase.from("hero_slides").insert({
      image_url: imageUrl,
      cta_href: ctaHref.trim() || null,
      sort_order: total,
    });
    if (error) return toast.error(error.message);
    toast.success("Banner criado");
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
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button className="!bg-[#3F2424] hover:!bg-[#694141]">
              <Plus className="h-4 w-4 mr-1" /> Novo banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Imagem do banner</Label>
                <p className="text-xs text-muted-foreground">
                  Dimensões recomendadas: 1920×670px
                </p>
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition cursor-pointer"
                  style={{ aspectRatio: "1920 / 670" }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Pré-visualização"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-1" /> Trocar imagem
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Link de redirecionamento</Label>
                <Input
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="/loja ou https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={create}
                disabled={!imageUrl || uploading}
                className="!bg-[#3F2424] hover:!bg-[#694141]"
              >
                Criar
              </Button>
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
            <div className="bg-muted relative" style={{ aspectRatio: "1920 / 670" }}>
              {s.image_url && (
                <img
                  src={s.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              <div className="text-xs text-muted-foreground truncate">
                {s.cta_href || "Sem link"}
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs px-2 py-1 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                >
                  {s.is_active ? "Ativo" : "Inativo"}
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="text-destructive hover:bg-destructive/10 rounded p-1.5"
                >
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
