import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | Lb Closet" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isStaff, loading } = useAuth();
  if (loading) return <p>Carregando…</p>;
  if (!isStaff) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Sua conta não tem permissão de staff. <Link to="/" className="underline">Voltar</Link>
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Painel administrativo</h1>
      <p className="text-sm text-muted-foreground">
        O CRUD completo de produtos, variantes e taxonomias está em construção. Por enquanto, use o SQL Editor do Supabase para inserir os primeiros produtos seguindo o schema em <code>db/0001_init.sql</code>.
      </p>
      <div className="rounded border p-4 text-sm">
        <p className="font-medium mb-2">Próximos passos (no SQL Editor):</p>
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li>Rode <code>db/0002_carts.sql</code> para habilitar carrinho persistente.</li>
          <li>Insira categorias, cores, tamanhos e materiais.</li>
          <li>Insira produtos e suas variantes/imagens.</li>
        </ol>
      </div>
    </div>
  );
}
