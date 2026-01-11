'use client'

import { useState } from 'react'
import { BetData } from '@/types/bet'
import ProgressIndicator from './ProgressIndicator'
import SpecialQuotationsModal from './SpecialQuotationsModal'
import ModalitySelection from './ModalitySelection'
import AnimalSelection from './AnimalSelection'
import PositionAmountDivision from './PositionAmountDivision'
import LocationSelection from './LocationSelection'
import BetConfirmation from './BetConfirmation'

const INITIAL_BET_DATA: BetData = {
  modality: null,
  animals: [],
  position: null,
  customPosition: false,
  amount: 2.0,
  divisionType: 'all',
  useBonus: false,
  bonusAmount: 1.6,
  location: null,
  instant: false,
  specialTime: null,
}

export default function BetFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [betData, setBetData] = useState<BetData>(INITIAL_BET_DATA)
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bicho' | 'loteria'>('bicho')

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAnimalToggle = (animalId: number) => {
    setBetData((prev) => ({
      ...prev,
      animals: prev.animals.includes(animalId)
        ? prev.animals.filter((id) => id !== animalId)
        : [...prev.animals, animalId],
    }))
  }

  const handleConfirm = () => {
    // Aqui você implementaria a lógica de confirmação da aposta
    console.log('Aposta confirmada:', betData)
    alert('Aposta confirmada! (Implementar integração com API)')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('bicho')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'bicho'
                    ? 'border-blue text-blue'
                    : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:animal-rabbit-20-regular"></span>
                Bicho
              </button>
              <button
                onClick={() => setActiveTab('loteria')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'loteria'
                    ? 'border-blue text-blue'
                    : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:ticket-diagonal-16-regular"></span>
                Loterias
              </button>
            </div>

            {activeTab === 'bicho' ? (
              <ModalitySelection
                selectedModality={betData.modality}
                onModalitySelect={(modalityId) =>
                  setBetData((prev) => ({ ...prev, modality: modalityId }))
                }
                onSpecialQuotationsClick={() => setShowSpecialModal(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="iconify i-fluent:ticket-diagonal-16-regular text-6xl text-gray-400 mb-4"></span>
                <p className="text-gray-600">Seção de Loterias em desenvolvimento</p>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <AnimalSelection
            selectedAnimals={betData.animals}
            onAnimalToggle={handleAnimalToggle}
          />
        )

      case 3:
        return (
          <PositionAmountDivision
            position={betData.position}
            customPosition={betData.customPosition}
            amount={betData.amount}
            divisionType={betData.divisionType}
            useBonus={betData.useBonus}
            bonusAmount={betData.bonusAmount}
            onPositionChange={(pos) => setBetData((prev) => ({ ...prev, position: pos }))}
            onCustomPositionChange={(checked) =>
              setBetData((prev) => ({ ...prev, customPosition: checked }))
            }
            onAmountChange={(amount) => setBetData((prev) => ({ ...prev, amount }))}
            onDivisionTypeChange={(type) => setBetData((prev) => ({ ...prev, divisionType: type }))}
            onBonusToggle={(use) => setBetData((prev) => ({ ...prev, useBonus: use }))}
          />
        )

      case 4:
        return (
          <LocationSelection
            instant={betData.instant}
            location={betData.location}
            specialTime={betData.specialTime}
            onInstantChange={(checked) => setBetData((prev) => ({ ...prev, instant: checked }))}
            onLocationChange={(loc) => setBetData((prev) => ({ ...prev, location: loc }))}
            onSpecialTimeChange={(time) => setBetData((prev) => ({ ...prev, specialTime: time }))}
          />
        )

      case 5:
        return (
          <BetConfirmation betData={betData} onConfirm={handleConfirm} onBack={handleBack} />
        )

      default:
        return null
    }
  }

  return (
    <div>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} />

      {/* Special Quotations Modal */}
      <SpecialQuotationsModal
        isOpen={showSpecialModal}
        onClose={() => setShowSpecialModal(false)}
      />

      {/* Step Content */}
      <div className="mb-6">{renderStep()}</div>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={currentStep === 1 && !betData.modality && activeTab === 'bicho'}
            className="flex-1 rounded-lg bg-yellow px-6 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  )
}
