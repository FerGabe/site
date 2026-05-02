export type GiftCategory =
  | "lua-de-mel"
  | "casa"
  | "cozinha"
  | "eletro"
  | "contribuicao";

export type GiftItem = {
  id: string;
  name: string;
  /** Preço em reais; omitido ou null quando o convidado define o valor. */
  price: number | null;
  image: string;
  category: GiftCategory;
  active: boolean;
  /** Marcado pelos noivos: já foi comprado — some da lista pública. */
  purchased?: boolean;
  /** Presente com valor livre (ex.: contribuição). */
  openAmount?: boolean;
  /** Payload Pix copia-e-cola específico do presente. */
  pixCode?: string;
  /** Link de pagamento por cartão específico do presente. */
  cardPaymentLink?: string;
};
