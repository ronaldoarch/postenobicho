'use client'

const stories = [
  {
    id: 1,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/aposte-com-seguranca.webp',
    alt: 'Aposte com segurança!'
  },
  {
    id: 2,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/aposte-agora.webp',
    alt: 'Aposte agora e tente a sorte!'
  },
  {
    id: 3,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/eles-apostam-e-faturam.webp',
    alt: 'Eles apostam e faturam!'
  },
  {
    id: 4,
    image: 'https://ponto-do-bicho.b-cdn.net/stories/fezinha-hoje.webp',
    alt: 'Fez sua fezinha hoje?'
  },
]

export default function StoriesSection() {
  return (
    <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="iconify i-fluent:image-multiple-24-regular text-gray-scale-700 text-2xl lg:text-3xl"></span>
          <h2 className="text-lg font-bold uppercase leading-none text-gray-scale-700 md:text-xl lg:text-2xl">
            STORIES
          </h2>
        </div>
      </div>

      <div className="scrollbar-none flex w-full items-center justify-center gap-4 overflow-auto px-4 md:gap-6">
        {stories.map((story) => (
          <div
            key={story.id}
            className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full lg:h-24 lg:w-24"
          >
            <div className="absolute h-full w-full bg-gradient-to-br from-[#DC4CBD] via-[#D85954] to-[#EEB639] p-0.5">
              <div className="h-full w-full overflow-hidden rounded-full bg-white">
                <img
                  src={story.image}
                  alt={story.alt}
                  className="aspect-square h-full w-full scale-110 object-cover"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Botão "Saiba o que seu sonho revela!" */}
        <div className="ml-4 shrink-0">
          <button className="flex items-center gap-2 rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-scale-70 lg:px-6 lg:py-3 lg:text-base">
            Saiba o que seu sonho revela!
            <span className="iconify i-ph:book-open text-xl"></span>
          </button>
        </div>
      </div>
    </section>
  )
}
