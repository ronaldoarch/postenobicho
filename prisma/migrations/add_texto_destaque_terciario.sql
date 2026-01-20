-- Adicionar campos textoDestaque e textoTerciario ao modelo Tema
ALTER TABLE "Tema" ADD COLUMN "textoDestaque" TEXT DEFAULT '#1F2937';
ALTER TABLE "Tema" ADD COLUMN "textoTerciario" TEXT DEFAULT '#6B7280';
