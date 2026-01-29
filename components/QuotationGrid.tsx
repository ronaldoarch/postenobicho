'use client'

import { useModalidades } from '@/hooks/useModalidades'
import { MODALITIES } from '@/data/modalities'

export default function QuotationGrid() {
  const { modalidades, loading } = useModalidades()

  // Usar modalidades do banco ou fallback estático
  const modalidadesParaExibir = modalidades.length > 0 ? modalidades : MODALITIES

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Carregando cotações...</div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modalidadesParaExibir.map((quotation) => {
          return (
            <div
              key={quotation.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-950">{quotation.name}</h3>
              </div>
              <p className="mb-4 text-2xl font-extrabold text-blue">
                {quotation.value}
              </p>

              <a
                href={`/apostar?modalidade=${quotation.id}&modalidadeName=${encodeURIComponent(quotation.name)}`}
                className="mt-auto rounded-lg bg-blue px-4 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors text-center"
              >
                JOGAR
              </a>
            </div>
          )
        })}
      </div>
    </>
  )
}
