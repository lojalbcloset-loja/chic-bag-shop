import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Trash2, Search, Upload, Loader2, ImageIcon, Star, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProdutosPage,
});

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  category: { name: string } | null;
  variants: { price_cents: number; stock: number; compare_at_price_cents: number | null }[];
  images: { url: string; is_primary: boolean; sort_order: number }[];
};

const DEFAULT_CATEGORIES = [
  { name: "Bolsas", slug: "bolsas" },
  { name: "Carteiras", slug: "carteiras" },
  { name: "Cintos", slug: "cintos" },
  { name: "Bonés", slug: "bones" },
];
const MAX_IMAGES = 6;
const IMG_RECOMMEND = "1200×1600px · proporção 3:4 · JPG, PNG ou WEBP";

async function fetchProducts(q: string) {
  let query = supabase
    .from("products")
    .select(`
      id, slug, name, is_active, is_featured, created_at,
      category:categories(name),
      variants:product_variants(price_cents, stock, compare_at_price_cents),
      images:product_images(url, is_primary, sort_order)
    `)
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProductRow[];
}

async function fetchCategories() {
  // Garante que as 4 categorias padrão existam
  await supabase
    .from("categories")
    .upsert(
      DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sort_order: i, is_active: true })),
      { onConflict: "slug", ignoreDuplicates: true },
    );
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtPrice = (cents: number) => brl.format((cents ?? 0) / 100);
const parsePrice = (s: string) => {
  const n = Number(s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100);
};

function ProdutosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => fetchProducts(search),
  });

  const [open, setOpen] = useState(false);

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const toggleActive = async (p: ProductRow) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie o catálogo da loja</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="!bg-[#3F2424] hover:!bg-[#694141]">
              <Plus className="h-4 w-4 mr-1" /> Novo produto
            </Button>
          </DialogTrigger>
          <ProductFormDialog
            onClose={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["admin-products"] });
            }}
          />
        </Dialog>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 w-[80px]">Imagem</th>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3">Preço</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Estoque</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && (data ?? []).length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum produto cadastrado.</td></tr>
              )}
              {(data ?? []).map((p) => {
                const primary = [...p.images].sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))[0];
                const v = p.variants?.[0];
                const stock = (p.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
                const onSale = v?.compare_at_price_cents && v.compare_at_price_cents > v.price_cents;
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="h-14 w-14 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                        {primary ? (
                          <img src={primary.url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {v ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{fmtPrice(v.price_cents)}</span>
                          {onSale && (
                            <span className="text-xs text-muted-foreground line-through">
                              {fmtPrice(v.compare_at_price_cents!)}
                            </span>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn("text-xs px-2 py-1 rounded-full",
                        stock === 0 ? "bg-red-100 text-red-700" :
                        stock <= 3 ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700")}>
                        {stock} un.
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                      >
                        {p.is_active ? "Ativo" : "Inativo"}
                      </button>
                      {p.is_featured && (
                        <span className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                          <Star className="h-3 w-3" /> Destaque
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(p.id)}
                        className="text-destructive hover:bg-destructive/10 rounded p-1.5"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- FORMULÁRIO ---------- */

type FormState = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  productType: string;
  brand: string;
  description: string;
  priceStr: string;
  compareStr: string;
  stockStr: string;
  isActive: boolean;
  isFeatured: boolean;
  isOferta: boolean;
  isPromo: boolean;
  images: { url: string; is_primary: boolean }[];
};

const empty: FormState = {
  name: "", slug: "", sku: "", categoryId: "", productType: "", brand: "",
  description: "", priceStr: "", compareStr: "", stockStr: "0",
  isActive: true, isFeatured: false, isOferta: false, isPromo: false,
  images: [],
};

function ProductFormDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({ queryKey: ["admin-categories"], queryFn: fetchCategories });

  // auto slug
  useEffect(() => {
    if (!f.slug && f.name) setF((p) => ({ ...p, slug: slugify(p.name) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.name]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const remaining = MAX_IMAGES - f.images.length;
    if (remaining <= 0) return toast.error(`Máximo de ${MAX_IMAGES} imagens`);
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: { url: string; is_primary: boolean }[] = [];
      for (const file of list) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("site-assets")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (error) throw error;
        const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
        uploaded.push({ url: pub.publicUrl, is_primary: false });
      }
      setF((p) => {
        const merged = [...p.images, ...uploaded];
        if (!merged.some((i) => i.is_primary) && merged.length) merged[0].is_primary = true;
        return { ...p, images: merged };
      });
      toast.success(`${uploaded.length} imagem(ns) carregada(s)`);
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setPrimary = (idx: number) => {
    setF((p) => ({ ...p, images: p.images.map((i, n) => ({ ...i, is_primary: n === idx })) }));
  };
  const removeImage = (idx: number) => {
    setF((p) => {
      const next = p.images.filter((_, n) => n !== idx);
      if (next.length && !next.some((i) => i.is_primary)) next[0].is_primary = true;
      return { ...p, images: next };
    });
  };

  const save = async () => {
    if (!f.name.trim()) return toast.error("Informe o nome");
    if (!f.priceStr.trim()) return toast.error("Informe o preço");
    if (f.images.length === 0) return toast.error("Adicione ao menos uma imagem");

    const price = parsePrice(f.priceStr);
    const compare = f.isOferta && f.compareStr ? parsePrice(f.compareStr) : null;
    if (compare !== null && compare <= price) {
      return toast.error("O preço 'de' deve ser maior que o preço atual");
    }

    setSaving(true);
    try {
      const slug = f.slug || slugify(f.name);
      const sku = f.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;

      const { data: prod, error: e1 } = await supabase.from("products").insert({
        name: f.name.trim(),
        slug,
        sku_base: sku,
        description: f.description || null,
        category_id: f.categoryId || null,
        gender: f.productType || null,
        brand: f.brand || null,
        is_active: f.isActive,
        is_featured: f.isFeatured,
      }).select("id").single();
      if (e1 || !prod) throw e1 ?? new Error("Falha ao criar produto");

      const { error: e2 } = await supabase.from("product_variants").insert({
        product_id: prod.id,
        sku,
        price_cents: price,
        compare_at_price_cents: compare,
        stock: Math.max(0, parseInt(f.stockStr || "0", 10)),
        is_active: true,
      });
      if (e2) throw e2;

      const imgs = f.images.map((img, idx) => ({
        product_id: prod.id,
        url: img.url,
        is_primary: img.is_primary,
        sort_order: idx,
      }));
      const { error: e3 } = await supabase.from("product_images").insert(imgs);
      if (e3) throw e3;

      const tags: { product_id: string; tag: string }[] = [];
      if (f.isOferta) tags.push({ product_id: prod.id, tag: "oferta" });
      if (f.isPromo) tags.push({ product_id: prod.id, tag: "promocao" });
      if (tags.length) {
        const { error: e4 } = await supabase.from("product_tags").insert(tags);
        if (e4) throw e4;
      }

      toast.success("Produto criado");
      setF(empty);
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const primaryImage = useMemo(() => f.images.find((i) => i.is_primary) ?? f.images[0], [f.images]);

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Novo produto</DialogTitle>
        <DialogDescription>
          Preencha as informações do produto. Os campos abaixo aparecerão na página do produto, na vitrine da loja e nos cards de destaque.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-8 py-2">
        {/* IDENTIFICAÇÃO */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Identificação
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome do produto *</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Bolsa Louis Vuitton Neverfull" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={f.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material do produto</Label>
              <Input
                value={f.productType}
                onChange={(e) => set("productType", e.target.value)}
                placeholder="Ex: Bolsa 100% em Couro ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={f.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="Gerado automaticamente a partir do nome"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={f.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="Gerado automaticamente se vazio"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Marca (opcional)</Label>
              <Input value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Ex: Louis Vuitton" />
            </div>
          </div>
        </section>

        {/* IMAGENS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Imagens ({f.images.length}/{MAX_IMAGES})
            </h3>
            <p className="text-xs text-muted-foreground">{IMG_RECOMMEND}</p>
          </div>

          {/* Destaque */}
          <div
            className="relative w-full rounded-lg border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-muted/50 transition"
            style={{ aspectRatio: "3 / 4", maxWidth: 320 }}
            onClick={() => fileRef.current?.click()}
          >
            {primaryImage ? (
              <img src={primaryImage.url} alt="Destaque" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Imagem destaque</p>
                    <p className="text-xs">{IMG_RECOMMEND}</p>
                  </>
                )}
              </div>
            )}
            {primaryImage && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                <Star className="h-3 w-3" /> Destaque
              </div>
            )}
          </div>

          {/* Galeria */}
          {f.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {f.images.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative aspect-[3/4] rounded-md overflow-hidden border bg-muted group",
                    img.is_primary && "ring-2 ring-primary",
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(idx)}
                        className="bg-white/90 text-foreground rounded p-1.5 hover:bg-white"
                        title="Tornar destaque"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="bg-white/90 text-destructive rounded p-1.5 hover:bg-white"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || f.images.length >= MAX_IMAGES}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Adicionar imagens
            </Button>
            <span className="text-xs text-muted-foreground">
              Até {MAX_IMAGES} imagens · clique na ⭐ para definir o destaque
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </section>

        {/* PREÇO E ESTOQUE */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Preço e estoque
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço *</Label>
              <Input
                value={f.priceStr}
                onChange={(e) => set("priceStr", e.target.value)}
                placeholder="R$ 0,00"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade em estoque</Label>
              <Input
                type="number"
                min={0}
                value={f.stockStr}
                onChange={(e) => set("stockStr", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className={cn(!f.isOferta && "text-muted-foreground")}>
                Preço "de" (oferta)
              </Label>
              <Input
                value={f.compareStr}
                onChange={(e) => set("compareStr", e.target.value)}
                placeholder="R$ 0,00"
                disabled={!f.isOferta}
                inputMode="decimal"
              />
            </div>
          </div>
        </section>

        {/* DESCRIÇÃO */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Descrição
          </h3>
          <Textarea
            rows={5}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Detalhes do produto, materiais, medidas, instruções de cuidado…"
          />
        </section>

        {/* VISIBILIDADE */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Visibilidade e marcações
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <ToggleRow
              label="Produto ativo"
              hint="Visível na loja"
              checked={f.isActive}
              onChange={(v) => set("isActive", v)}
            />
            <ToggleRow
              label="Destaque na home"
              hint="Aparece na vitrine principal"
              checked={f.isFeatured}
              onChange={(v) => set("isFeatured", v)}
            />
            <ToggleRow
              label="Em oferta"
              hint="Mostra preço 'de / por'"
              checked={f.isOferta}
              onChange={(v) => set("isOferta", v)}
            />
            <ToggleRow
              label="Em promoção"
              hint="Recebe selo de promoção"
              checked={f.isPromo}
              onChange={(v) => set("isPromo", v)}
            />
          </div>
        </section>
      </div>

      <DialogFooter className="border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={save} disabled={saving} className="!bg-[#3F2424] hover:!bg-[#694141]">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando…</> : "Criar produto"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ToggleRow({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 cursor-pointer hover:bg-muted/30">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
