import { MonogramMark } from "@/shared/components/MonogramMark";

export function Footer() {
  return (
    <footer className="border-t border-bege-claro bg-white/50 py-14">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-3 flex justify-center">
          <MonogramMark size={74} className="h-16 w-auto" />
        </div>
        <p className="text-sm tracking-[0.25em] uppercase text-texto/50 mb-6">
          6 de junho de 2026
        </p>
        <p className="text-texto/60 text-sm max-w-md mx-auto leading-relaxed">
          Com gratidão e amor — obrigado por fazer parte da nossa história.
        </p>
      </div>
    </footer>
  );
}
