'use client'

import { SPECIAL_QUOTATIONS } from '@/data/modalities'

interface SpecialQuotationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SpecialQuotationsModal({ isOpen, onClose }: SpecialQuotationsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-950">Cotações Especiais por Loteria</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span className="iconify i-material-symbols:close text-2xl"></span>
          </button>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="text-lg font-bold text-blue">Milhar</span>
        </div>

        {/* List */}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {SPECIAL_QUOTATIONS.map((quotation) => (
            <div
              key={quotation.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-950">{quotation.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue">{quotation.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
