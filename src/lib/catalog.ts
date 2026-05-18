export type Category = "Bolsas" | "Carteiras" | "Cintos" | "Bonés";

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: Category;
  tag: string;
  color: string;
  material: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  isNew?: boolean;
  image: string;
  imageAlt: string;
  imageHover?: string;
  description?: string;
}

const baseProducts: Product[] = [
  { id: 1, sku: "LB-33078-106", name: "Bolsa Gash Tote De Ombro Preta", category: "Bolsas", tag: "NOVIDADES", color: "Preto", material: "Couro", price: 249.99, oldPrice: 299.9, discount: 20, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10996952/BS73011GA.0600.01.png?v=639125733458700000", imageAlt: "Bolsa Gash Tote De Ombro Preta" },
  { id: 2, sku: "LB-46470-027", name: "Bolsa Feminina Gash Texturizada De Ombro Fendi", category: "Bolsas", tag: "NOVIDADES", color: "Off White", material: "Couro", price: 269.99, oldPrice: 329.9, discount: 18, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10998632/999999992732274_1.png?v=639126377046730000", imageAlt: "Bolsa Feminina Gash Texturizada De Ombro Fendi" },
  { id: 3, sku: "LB-46437-012", name: "Bolsa Gash Caramelo Transversal Feminina", category: "Bolsas", tag: "NOVIDADES", color: "Caramelo", material: "Couro", price: 239.99, oldPrice: 299.9, discount: 20, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10998303/999999992732261_1.png?v=639126339782130000", imageAlt: "Bolsa Gash Caramelo Transversal Feminina" },
  { id: 4, sku: "LB-55021-036", name: "Mochila Chenson Office Chic Feminina Marrom", category: "Bolsas", tag: "NOVIDADES", color: "Marrom", material: "Couro", price: 309.99, oldPrice: 379.9, discount: 18, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10973637/999999992738021--2-.webp?v=639117703015700000", imageAlt: "Mochila Chenson Office Chic Feminina Marrom" },
  { id: 5, sku: "LB-22038-012", name: "Bolsa Feminina Transversal Chenson Monograma Café", category: "Bolsas", tag: "NOVIDADES", color: "Marrom", material: "Camurça", price: 279.99, oldPrice: 349.9, discount: 20, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10981460/999999992738012--3-.webp?v=639118767958530000", imageAlt: "Bolsa Feminina Transversal Chenson Monograma Café" },
  { id: 6, sku: "LB-12009-083", name: "Bolsa Via Marte Shoulder Bag Bordô Verniz", category: "Bolsas", tag: "NOVIDADES", color: "Preto", material: "Camurça", price: 229.99, oldPrice: 289.9, discount: 21, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10958518/B1-351-01-312778-AMEIXA.jpg?v=639111992358500000", imageAlt: "Bolsa Via Marte Shoulder Bag Bordô Verniz" },
  { id: 7, sku: "LB-33042-012", name: "Bolsa Transversal Chenson Monograma Bege", category: "Bolsas", tag: "NOVIDADES", color: "Off White", material: "Algodão", price: 279.99, oldPrice: 349.9, discount: 20, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10981456/999999992738011--1-.webp?v=639118768688130000", imageAlt: "Bolsa Transversal Chenson Monograma Bege" },
  { id: 8, sku: "LB-46490-211", name: "Bolsa Ombro Chenson Bege Monograma + Necessarie", category: "Bolsas", tag: "NOVIDADES", color: "Off White", material: "Couro", price: 369.99, oldPrice: 459.9, discount: 20, isNew: true, image: "https://grupooscar.vtexassets.com/arquivos/ids/10967998/Chenson-Bolsa-3485499-bege-Pu-3--3-.webp?v=639114243348800000", imageAlt: "Bolsa Ombro Chenson Bege Monograma + Necessarie" },
];

const categoriesList: Category[] = ["Bolsas", "Carteiras", "Cintos", "Bonés"];

// Replica a lógica do projeto original: 4 páginas × 8 produtos = 32 itens, um por categoria
export const allProducts: Product[] = [];
for (let page = 0; page < 4; page++) {
  baseProducts.forEach((p) => {
    const suffix = page > 0 ? ` ${"I".repeat(page + 1)}` : "";
    allProducts.push({
      ...p,
      id: p.id + page * 8,
      sku: `${p.sku}-${page + 1}`,
      category: categoriesList[page],
      name: p.name + (suffix ? ` ${suffix}` : ""),
      description:
        "Peça selecionada da coleção Lb Closet. Acabamento premium, costura reforçada e design exclusivo. Combina sofisticação e funcionalidade para o seu dia a dia.",
    });
  });
}

export const homeProducts = baseProducts;

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const promoMessages = [
  "Compras acima de R$500.00 Parcele em até 10x sem juros",
  "Troca grátis Você tem 7 dias p/ troca",
  "Compre pelo WhatsApp com uma consultora",
  "Promoção com até 50% off em peças selecionadas",
];

export interface FilterState {
  category: string;
  color: string;
  size: string;
  materials: string[];
  min: string;
  max: string;
  sort: string;
  search: string;
}

export function filterProducts(list: Product[], state: FilterState): Product[] {
  let filtered = list.filter((p) => {
    const matchCat =
      !state.category ||
      p.category === state.category ||
      (state.category === "Liqui" && (p.discount ?? 0) > 0);
    const matchColor = !state.color || p.color === state.color;
    const matchMat = !state.materials.length || state.materials.includes(p.material);
    const matchMin = !state.min || p.price >= Number(state.min);
    const matchMax = !state.max || p.price <= Number(state.max);
    const hay = `${p.name} ${p.category} ${p.sku}`.toLowerCase();
    const matchSearch = !state.search || hay.includes(state.search.toLowerCase());
    return matchCat && matchColor && matchMat && matchMin && matchMax && matchSearch;
  });
  filtered = [...filtered].sort((a, b) => {
    if (state.sort === "priceAsc") return a.price - b.price;
    if (state.sort === "priceDesc") return b.price - a.price;
    if (state.sort === "discount") return (b.discount ?? 0) - (a.discount ?? 0);
    if (state.sort === "new") return Number(b.isNew) - Number(a.isNew);
    return b.id - a.id;
  });
  return filtered;
}

export function getProductById(id: number): Product | undefined {
  return allProducts.find((p) => p.id === id);
}

export function getRelatedProducts(p: Product, n = 4): Product[] {
  return allProducts.filter((x) => x.category === p.category && x.id !== p.id).slice(0, n);
}
