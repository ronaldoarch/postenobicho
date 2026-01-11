'use client'

import { useState } from 'react'

const faqs = [
  {
    id: 1,
    question: 'A plataforma tem suporte',
    answer: 'Sim, nossa plataforma possui suporte completo via chat, WhatsApp e e-mail para atender todas as suas dúvidas e necessidades.',
  },
  {
    id: 2,
    question: 'A plataforma é segura',
    answer: 'Sim, nossa plataforma utiliza tecnologia de criptografia avançada e é 100% segura. Todos os dados são protegidos e os pagamentos são processados de forma segura.',
  },
  {
    id: 3,
    question: 'Quanto tempo para receber',
    answer: 'Os saques via PIX são processados imediatamente, geralmente em poucos minutos. Para outros métodos de pagamento, o tempo pode variar.',
  },
  {
    id: 4,
    question: 'Tem valor mínimo para saque',
    answer: 'Sim, o valor mínimo para saque é R$ 10,00. Não há valor máximo para saque.',
  },
  {
    id: 5,
    question: 'Tem valor mínimo ou máximo para apostar',
    answer: 'Sim, o valor mínimo para apostar é R$ 0,50. O valor máximo varia de acordo com o tipo de aposta. Consulte nossos termos para mais detalhes.',
  },
  {
    id: 6,
    question: 'Como fazer uma aposta',
    answer: 'Para fazer uma aposta, basta criar uma conta, fazer um depósito e escolher seus números. É simples, rápido e seguro!',
  },
]

export default function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="iconify i-fluent:question-circle-12-filled text-gray-scale-700 text-2xl lg:text-3xl"></span>
          <h2 className="text-lg font-bold uppercase leading-none text-gray-scale-700 md:text-xl lg:text-2xl">
            DÚVIDAS FREQUENTES
          </h2>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-6">
        {faqs.map((faq) => (
          <li key={faq.id}>
            <div className="flex w-full flex-col overflow-hidden rounded-2xl text-blue">
              <div
                className="flex w-full cursor-pointer select-none items-center justify-between px-6 py-4 font-semibold text-grey-scale-900 hover:bg-gray-50 transition-colors"
                onClick={() => toggleFAQ(faq.id)}
              >
                <span className="text-lg">{faq.question}</span>
                <span
                  className={`iconify i-mdi:chevron-down text-grey-scale-900 text-2xl transition-transform ${
                    openId === faq.id ? 'rotate-180' : ''
                  }`}
                  style={{ fontSize: '24px' }}
                ></span>
              </div>
              {openId === faq.id && (
                <div className="px-6 pb-4 text-gray-700">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
