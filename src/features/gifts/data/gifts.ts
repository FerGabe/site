import type { GiftItem } from "../types/gift";
import { assetPath } from "@/shared/utils/assetPath";

/** Lista base (caminhos relativos; `WEDDING_GIFTS` aplica `assetPath` nas imagens). */
export const BASE_WEDDING_GIFTS: GiftItem[] = [
  { id: "jogo-copos", name: "Jogo de Copos", price: 120, image: "/gifts/jogo-copos.webp", category: "casa", active: true },
  { id: "ferro-passar", name: "Ferro de Passar", price: 130, image: "/gifts/ferro-passar.webp", category: "eletro", active: true },
  { id: "ventilador", name: "Ventilador", price: 135, image: "/gifts/ventilador.webp", category: "eletro", active: true },
  { id: "chaleira-eletrica", name: "Chaleira Elétrica", price: 140, image: "/gifts/chaleira-eletrica.webp", category: "eletro", active: true },
  { id: "kit-talheres-basico", name: "Kit Talheres Básico", price: 150, image: "/gifts/kit-talheres-basico.webp", category: "cozinha", active: true },
  { id: "kit-toalhas-banho", name: "Kit Toalhas Banho", price: 170, image: "/gifts/kit-toalhas-banho.webp", category: "casa", active: true },
  { id: "panela-antiaderente", name: "Panela Antiaderente", price: 180, image: "/gifts/panela-antiaderente.webp", category: "cozinha", active: true },
  { id: "sanduicheira", name: "Sanduicheira", price: 200, image: "/gifts/sanduicheira.webp", category: "eletro", active: true },
  { id: "jogo-pratos", name: "Jogo de Pratos", price: 220, image: "/gifts/jogo-pratos.webp", category: "cozinha", active: true },
  { id: "aspirador-po", name: "Aspirador de Pó", price: 240, image: "/gifts/aspirador-po.webp", category: "eletro", active: true },
  { id: "cafeteira", name: "Cafeteira", price: 250, image: "/gifts/cafeteira.webp", category: "eletro", active: true },
  { id: "liquidificador", name: "Liquidificador", price: 270, image: "/gifts/liquidificador.webp", category: "eletro", active: true },
  { id: "jogo-lencol", name: "Jogo de Lençol", price: 290, image: "/gifts/jogo-lencol.webp", category: "casa", active: true },
  { id: "kit-utensilios-cozinha", name: "Kit Utensílios de Cozinha", price: 310, image: "/gifts/kit-utensilios-cozinha.webp", category: "cozinha", active: true },
  { id: "kit-banheiro", name: "Kit Banheiro", price: 330, image: "/gifts/kit-banheiro.webp", category: "casa", active: true },
  { id: "edredom", name: "Edredom", price: 350, image: "/gifts/edredom.webp", category: "casa", active: true },
  { id: "air-fryer", name: "Air Fryer", price: 390, image: "/gifts/air-fryer.webp", category: "eletro", active: true },
  { id: "jogo-panelas", name: "Jogo de Panelas", price: 430, image: "/gifts/jogo-panelas.webp", category: "cozinha", active: true },
  { id: "cortinas", name: "Cortinas", price: 470, image: "/gifts/cortinas.webp", category: "casa", active: true },
  {
    id: "kit-organizadores",
    name: "Kit Organizadores",
    price: 500,
    image: "/gifts/kit-organizadores.webp",
    category: "casa",
    active: false,
  },
  {
    id: "cueca-noivo",
    name: "Cueca do noivo",
    price: 520,
    image: "/gifts/cueca-noivo.webp",
    category: "casa",
    active: true,
  },
  { id: "micro-ondas", name: "Micro-ondas", price: 550, image: "/gifts/micro-ondas.webp", category: "eletro", active: true },
  { id: "forno-eletrico", name: "Forno Elétrico", price: 620, image: "/gifts/forno-eletrico.webp", category: "eletro", active: true },
  { id: "purificador-agua", name: "Purificador de Água", price: 750, image: "/gifts/purificador-agua.webp", category: "eletro", active: true },
  { id: "mesa-lateral", name: "Mesa Lateral", price: 850, image: "/gifts/mesa-lateral.webp", category: "casa", active: true },
  { id: "jogo-malas", name: "Jogo de Malas", price: 950, image: "/gifts/jogo-malas.webp", category: "lua-de-mel", active: true },
  { id: "smart-tv-pequena", name: "Smart TV Pequena", price: 1500, image: "/gifts/smart-tv-pequena.webp", category: "eletro", active: true },
  { id: "lavadora-roupas", name: "Lavadora de Roupas", price: 2400, image: "/gifts/lavadora-roupas.webp", category: "eletro", active: true },
  { id: "sofa", name: "Sofá", price: 2500, image: "/gifts/sofa.webp", category: "casa", active: true },
  { id: "geladeira", name: "Geladeira", price: 2600, image: "/gifts/geladeira.webp", category: "eletro", active: true },
  { id: "viagem-lua-mel", name: "Viagem Lua de Mel", price: 3000, image: "/gifts/viagem-lua-mel.webp", category: "lua-de-mel", active: true },
];

export const WEDDING_GIFTS: GiftItem[] = BASE_WEDDING_GIFTS.map((gift) => ({
  ...gift,
  image: assetPath(gift.image),
}));
