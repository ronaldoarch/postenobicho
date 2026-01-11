'use client'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export default function ProgressIndicator({ currentStep, totalSteps = 5 }: ProgressIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1
        const isCompleted = step <= currentStep
        const isActive = step === currentStep

        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-colors ${
                isCompleted
                  ? 'border-blue bg-blue text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div
                className={`h-1 w-8 transition-colors ${
                  isCompleted ? 'bg-blue' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
