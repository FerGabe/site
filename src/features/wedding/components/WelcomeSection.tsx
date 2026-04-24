import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";

export function WelcomeSection() {
  return (
    <section className="py-20 md:py-28 bg-cream relative overflow-hidden">
      <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-salvia/10 blur-3xl" />
      <div className="absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-bege-claro/80 blur-2xl" />

      <div className="mx-auto max-w-3xl px-6 relative">
        <SectionTitle
          eyebrow="Boas-vindas"
          title="Com o coração aberto"
          subtitle={
            <>
              Queridos amigos e familiares, a alegria do nosso amor fica completa
              na presença de vocês. Cada detalhe deste site foi pensado como um
              envelope delicado: por dentro, todo o nosso carinho por quem
              torna este momento inesquecível.
            </>
          }
        />
        <BotanicalDivider />
        <p className="text-center text-texto/75 leading-relaxed text-base md:text-lg">
          Preparamos com carinho cada seção — da nossa história à lista de
          presentes e confirmação de presença. Sintam-se em casa.
        </p>
      </div>
    </section>
  );
}
