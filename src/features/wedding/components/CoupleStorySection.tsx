import Image from "next/image";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalCorner } from "@/shared/components/BotanicalFrame";
import { assetPath } from "@/shared/utils/assetPath";

export function CoupleStorySection() {
  return (
    <section
      id="historia"
      className="py-20 md:py-28 bg-gradient-to-b from-cream/70 via-bege-claro/35 to-cream/30 border-y border-bege-areia/25"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle
          eyebrow="Nossa história"
          title="De encontros simples a um sim eterno"
          subtitle="Do primeiro café aos planos de vida, aprendemos que o amor verdadeiro é calmo e cheio de presença."
        />

        <div className="grid gap-12 md:gap-16 md:grid-cols-2 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-3 rounded-[2rem] border border-white/80 bg-white/30 shadow-sm" />
            <div className="relative aspect-[4/5] rounded-[1.75rem] overflow-hidden shadow-md">
              <Image
                src={assetPath("/couple/casal-real.png")}
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

          <div className="order-1 md:order-2 space-y-6 text-texto/80 leading-relaxed text-base md:text-xl">
            <p>
              <span className="font-display text-2xl text-oliva">Fer</span> e{" "}
              <span className="font-display text-2xl text-oliva">Gabe</span>{" "}
              se encontraram em um dia simples, com conversa leve, riso fácil e
              uma conexão imediata.
            </p>
            <p>
              Hoje, ao dizer &ldquo;sim&rdquo;, celebramos também cada pessoa que fez
              parte da nossa caminhada até aqui.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
