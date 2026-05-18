# Plano — Lb Closet E-commerce

Repositório acessado com sucesso. Identifiquei:
- 3 páginas: `index.html` (home), `loja.html` (PLP), `produto.html` (PDP)
- Catálogo mockado em `assets/app.js` (carrinho, favoritos, filtros, busca, ordenação)
- Design system: Montserrat, vermelho `#c8102e`, marrom `#66504a`, layout premium estilo MrCat
- Logo + imagens hero em `assets/images/`
- Categorias: Bolsas, Carteiras, Cintos, Bonés

## Fase 1 — Portar UI (sem backend)

1. Copiar todos os assets (`/tmp/nova-loja/assets/images/*`) para `src/assets/`
2. Migrar tokens de `styles.css` (cores, tipografia, sombras) para `src/styles.css` como semantic tokens (oklch)
3. Criar rotas TanStack:
   - `src/routes/index.tsx` → home (promo bar, hero slider, categorias, seções por tipo)
   - `src/routes/loja.tsx` → PLP com filtros, busca, ordenação, grid
   - `src/routes/produto.$slug.tsx` → PDP
   - `src/routes/carrinho.tsx` → carrinho
   - `src/routes/checkout.tsx` → checkout (frete + pagamento)
   - `src/routes/conta.tsx` → login/cadastro + pedidos
4. Componentes: `Header`, `PromoBar`, `MobileMenu`, `MiniCart` (drawer), `ProductCard`, `Filters`, `Footer`
5. Estado global: carrinho + favoritos em Zustand + localStorage (persistente sem login)

## Fase 2 — Supabase BYO

Você cria o projeto em supabase.com e me passa 3 secrets via tool:
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

Crio arquivos SQL para você rodar no SQL Editor:
- Tabelas: `products`, `product_variants`, `product_images`, `categories`, `customer_addresses`, `orders`, `order_items`, `user_roles`
- RLS em todas
- Trigger `handle_new_user` (cria profile no signup)
- Função `has_role()` security-definer
- Storage bucket `product-images` (público para leitura)

Crio também os clients Supabase (browser, auth-middleware, admin) apontando para `process.env.SUPABASE_*` / `import.meta.env.VITE_SUPABASE_*`.

**Auth**: email/senha + Google (você precisará confirmar habilitar Google no painel Supabase Auth).

## Fase 3 — Melhor Envio (cálculo de frete)

- Você adiciona secret `MELHOR_ENVIO_TOKEN` + `MELHOR_ENVIO_CEP_ORIGEM`
- Server function `calcularFrete({cepDestino, items})` → POST para `https://melhorenvio.com.br/api/v2/me/shipment/calculate`
- Retorna lista de serviços (PAC, SEDEX, Jadlog, etc.) com preço e prazo
- UI no checkout: input de CEP → escolha de serviço

## Fase 4 — Stripe BYO (sua conta)

- Você adiciona secrets `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- Server function `criarCheckoutSession({orderId})` → cria Stripe Checkout Session com `line_items` (produtos + frete) e `metadata: { order_id }`
- Server route `POST /api/public/stripe-webhook` → verifica assinatura, marca pedido como `paid`, debita estoque
- Você cadastra a URL do webhook no painel Stripe (eu te passo a URL exata)

## Fase 5 — Admin

Página `/admin` (gate por role `admin`) para:
- CRUD de produtos (upload de imagens via Storage)
- Lista de pedidos com status (pendente, pago, enviado, entregue)
- Atualizar rastreio (Melhor Envio)

## Detalhes técnicos

- Stack: TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 + shadcn/ui
- `createServerFn` para toda lógica server-side (não usar Edge Functions)
- `requireSupabaseAuth` middleware para rotas autenticadas
- `supabaseAdmin` (service role) só em webhook do Stripe e operações admin
- Stripe via SDK `stripe` (Node-compatible, roda em Worker)
- Validação com Zod em toda server function
- Deploy: você exporta pro GitHub e hospeda onde quiser (Vercel/Cloudflare/VPS), reconfigurando as mesmas env vars

## Ordem de execução

```text
Turno 1 (agora):  Fase 1 — portar UI completa com dados mockados
Turno 2:          Você cria projeto Supabase → me passa secrets → Fase 2 (schema + auth)
Turno 3:          Você passa token Melhor Envio + CEP origem → Fase 3
Turno 4:          Você passa chaves Stripe → Fase 4 (checkout + webhook)
Turno 5:          Fase 5 (admin)
```

Posso começar pela **Fase 1** imediatamente — não precisa de nenhuma chave ainda. Confirma?
