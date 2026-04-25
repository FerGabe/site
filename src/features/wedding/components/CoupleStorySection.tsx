import Image from "next/image";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalCorner } from "@/shared/components/BotanicalFrame";

export function CoupleStorySection() {
  return (
    <section
      id="historia"
      className="py-20 md:py-28 bg-bege-claro/40 border-y border-bege-areia/25"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle
          eyebrow="Nossa história"
          title="De encontros simples a um sim eterno"
          subtitle="Do primeiro café ao planejamento dos sonhos — cada passo nos ensinou que o amor verdadeiro é calmo, profundo e feito de presença."
        />

        <div className="grid gap-12 md:gap-16 md:grid-cols-2 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-3 rounded-[2rem] border border-white/80 bg-white/30 shadow-sm" />
            <div className="relative aspect-[4/5] rounded-[1.75rem] overflow-hidden shadow-md">
              <Image
                src="/couple/casal-real.png"
                alt="Casal — imagem ilustrativa"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-texto/25 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-2 md:-right-4">
              <BotanicalCorner className="w-20 md:w-28 text-oliva/40" flip />
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-6 text-texto/80 leading-relaxed text-base md:text-lg">
            <p>
              <span className="font-display text-2xl text-oliva">Fer</span> e{" "}
              <span className="font-display text-2xl text-oliva">Gabe</span>{" "}
              se encontraram em um daqueles dias em que o tempo parece
              conspirar a favor: conversas longas, risos fáceis e a sensação de
              que o mundo tinha encolhido só para caber dois.
            </p>
            <p>
              Entre passeios sob o céu de estrelas e planos desenhados no
              verso de guardanapos de papelaria, fomos costurando uma história
              leve e profunda — como linho e renda no mesmo guarda-roupa.
            </p>
            <p>
              Hoje, ao dizer &ldquo;sim&rdquo;, queremos celebrar não apenas o
              casamento, mas cada pessoa que nos ajudou a chegar aqui. Esta
              página é o nosso convite aberto: entrem, respirem fundo e sintam o
              perfume das folhas novas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
