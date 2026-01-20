'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Story {
  id: number
  title?: string
  image?: string
  video?: string
  alt?: string
}

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export default function StoryViewer({ stories, initialIndex, isOpen, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  const handleNext = () => {
    if (videoRef) {
      videoRef.pause()
      setVideoRef(null)
    }
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (videoRef) {
      videoRef.pause()
      setVideoRef(null)
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      return
    }

    setCurrentIndex(initialIndex)
    setProgress(0)

    const currentStory = stories[initialIndex]
    const isVideo = !!currentStory?.video

    // Para vídeos, não usar progresso automático (o vídeo controla)
    if (isVideo) {
      return
    }

    // Para imagens, usar progresso automático
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Avança para próximo story
          setCurrentIndex((current) => {
            if (current < stories.length - 1) {
              return current + 1
            } else {
              onClose()
              return current
            }
          })
          return 0
        }
        return prev + 2 // Incrementa a cada 100ms (total 5s para completar)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, initialIndex, stories, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, stories.length])

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleNext()
    } else {
      handlePrevious()
    }
  }

  if (!isOpen || stories.length === 0) return null

  const currentStory = stories[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress bars no topo */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
        {stories.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-100 ${
                index < currentIndex ? 'w-full' : index === currentIndex ? 'w-full' : 'w-0'
              }`}
              style={
                index === currentIndex
                  ? { width: `${progress}%`, transition: 'width 0.1s linear' }
                  : {}
              }
            />
          </div>
        ))}
      </div>

      {/* Botão fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Story atual */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.video ? (
          <video
            ref={(el) => {
              setVideoRef(el)
              if (el) {
                // Tentar reproduzir com áudio quando o vídeo estiver pronto
                el.play().catch((err) => {
                  console.log('Autoplay bloqueado, tentando com interação do usuário:', err)
                })
              }
            }}
            src={currentStory.video}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            onEnded={handleNext}
            onLoadedData={(e) => {
              // Tentar habilitar áudio quando o vídeo carregar
              const video = e.currentTarget
              video.muted = false
              video.play().catch((err) => {
                console.log('Reprodução bloqueada:', err)
              })
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget
              if (video.duration) {
                const progressPercent = (video.currentTime / video.duration) * 100
                setProgress(progressPercent)
              }
            }}
          />
        ) : (
          <Image
            src={currentStory.image || ''}
            alt={currentStory.alt || currentStory.title || 'Story'}
            fill
            className="object-contain"
            priority
          />
        )}

        {/* Área clicável esquerda (anterior) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-40"
          onClick={() => handleSwipe('right')}
        />

        {/* Área clicável direita (próximo) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-40"
          onClick={() => handleSwipe('left')}
        />

        {/* Botões de navegação (desktop) */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === stories.length - 1}
          className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Swipe touch handlers */}
      <div
        className="absolute inset-0 z-30 touch-none"
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX
          let moved = false

          const onTouchMove = (e: TouchEvent) => {
            moved = true
          }

          const onTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX
            const diff = startX - endX

            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                handleSwipe('left') // Swipe left = próximo
              } else {
                handleSwipe('right') // Swipe right = anterior
              }
            }

            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
          }

          document.addEventListener('touchmove', onTouchMove)
          document.addEventListener('touchend', onTouchEnd)
        }}
      />
    </div>
  )
}
