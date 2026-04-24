import type { GiftItem } from "../types/gift";

/**
 * Lista inicial de presentes (UI).
 * Estrutura alinhada à coleção `gifts` no Firestore para futuro painel admin.
 */
export const WEDDING_GIFTS: GiftItem[] = [
  {
    id: "air-moon",
    name: "2 Passagens Aéreas para Lua de Mel",
    price: 1922.36,
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "abajur",
    name: "Abajur Decorativo",
    price: 254.81,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    category: "casa",
    active: true,
  },
  {
    id: "adega",
    name: "Adega de Vinhos Climatizada",
    price: 1549.9,
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
    category: "cozinha",
    active: true,
  },
  {
    id: "churrasqueira",
    name: "Churrasqueira Elétrica",
    price: 424.18,
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    category: "cozinha",
    active: true,
  },
  {
    id: "jantar-lua",
    name: "Jantar Romântico na Lua de Mel",
    price: 380,
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "cafe-manha",
    name: "Café da Manhã Especial",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1533089860892-b7f9cd252104?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "barco",
    name: "Passeio de Barco",
    price: 520,
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "hotel",
    name: "Diária de Hotel",
    price: 750,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "cota-lua",
    name: "Cota para Lua de Mel",
    price: 150,
    image:
      "https://images.unsplash.com/photo-1520854221050-0f4caff4497c?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "cota-especial",
    name: "Cota Especial para Lua de Mel",
    price: 300,
    image:
      "https://images.unsplash.com/photo-1464366400600-7168ecd8ae5f?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "cota-master",
    name: "Cota Master para Lua de Mel",
    price: 500,
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    category: "lua-de-mel",
    active: true,
  },
  {
    id: "kit-cama",
    name: "Kit Cama, Mesa e Banho",
    price: 420,
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    category: "casa",
    active: true,
  },
  {
    id: "panelas",
    name: "Jogo de Panelas",
    price: 680,
    image:
      "https://images.unsplash.com/photo-1584990347449-a8d7ede25fc0?w=800&q=80",
    category: "cozinha",
    active: true,
  },
  {
    id: "cafeteira",
    name: "Cafeteira Espresso",
    price: 499,
    image:
      "https://images.unsplash.com/photo-1517668808823-f9f701c5522e?w=800&q=80",
    category: "eletro",
    active: true,
  },
  {
    id: "airfryer",
    name: "Air Fryer",
    price: 399,
    image:
      "https://images.unsplash.com/photo-1585515320310-814830225c0f?w=800&q=80",
    category: "eletro",
    active: true,
  },
  {
    id: "aspirador",
    name: "Aspirador de Pó Vertical",
    price: 349,
    image:
      "https://images.unsplash.com/photo-1558317374-067fb5f90311?w=800&q=80",
    category: "eletro",
    active: true,
  },
  {
    id: "liquidificador",
    name: "Liquidificador Premium",
    price: 229,
    image:
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80",
    category: "eletro",
    active: true,
  },
  {
    id: "tacas",
    name: "Jogo de Taças",
    price: 189,
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
    category: "casa",
    active: true,
  },
  {
    id: "jantar-aparelho",
    name: "Aparelho de Jantar",
    price: 459,
    image:
      "https://images.unsplash.com/photo-1603199506016-b7a8b5f22188?w=800&q=80",
    category: "casa",
    active: true,
  },
  {
    id: "mesa-cabeceira",
    name: "Mesa de Cabeceira",
    price: 320,
    image:
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=80",
    category: "casa",
    active: true,
  },
  {
    id: "decoracao",
    name: "Decoração para Casa Nova",
    price: 250,
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    category: "casa",
    active: true,
  },
  {
    id: "contribuicao-livre",
    name: "Contribuição Livre",
    price: null,
    image:
      "https://images.unsplash.com/photo-1522673602040-b5a97d715434?w=800&q=80",
    category: "contribuicao",
    active: true,
    openAmount: true,
  },
];
