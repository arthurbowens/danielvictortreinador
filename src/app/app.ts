import { Component, signal } from '@angular/core';

export interface Testimonial {
  src: string;
  alt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  priceSuffix: string;
  duration?: string;
  tagline: string;
  description: string;
  features: string[];
  whatsappMessage: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Número com DDI + DDD, somente dígitos (ex.: 5562999999999). */
  readonly whatsappPhone = '5562999999999';

  readonly testimonials: Testimonial[] = [
    { src: 'depoimento1.jpeg', alt: 'Depoimento de aluna no chat' },
    { src: 'depoimento2.jpeg', alt: 'Depoimento de aluno' },
    { src: 'depoimento3.jpeg', alt: 'Depoimento de aluno' },
    { src: 'depoimento4.jpeg', alt: 'Depoimento de aluno' },
  ];

  readonly activeTestimonial = signal(0);

  private touchStartX = 0;
  private touchStartY = 0;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerActive = false;
  private readonly swipeThreshold = 48;

  carouselTransform(): string {
    const index = this.activeTestimonial();
    const offset = (100 / this.testimonials.length) * index;
    return `translate3d(-${offset}%, 0, 0)`;
  }

  carouselSlideBasis(): string {
    return `${100 / this.testimonials.length}%`;
  }

  nextTestimonial(): void {
    const total = this.testimonials.length;
    this.activeTestimonial.update((i) => (i + 1) % total);
  }

  prevTestimonial(): void {
    const total = this.testimonials.length;
    this.activeTestimonial.update((i) => (i - 1 + total) % total);
  }

  goToTestimonial(index: number): void {
    this.activeTestimonial.set(index);
  }

  onCarouselTouchStart(event: Event): void {
    if (!(event instanceof TouchEvent) || event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onCarouselTouchEnd(event: Event): void {
    if (!(event instanceof TouchEvent) || event.changedTouches.length === 0) return;
    const touch = event.changedTouches[0];
    this.handleHorizontalSwipe(touch.clientX - this.touchStartX, touch.clientY - this.touchStartY);
  }

  onCarouselPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    this.pointerActive = true;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
  }

  onCarouselPointerUp(event: PointerEvent): void {
    if (event.pointerType === 'touch' || !this.pointerActive) return;
    this.pointerActive = false;
    this.handleHorizontalSwipe(
      event.clientX - this.pointerStartX,
      event.clientY - this.pointerStartY,
    );
  }

  onCarouselKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextTestimonial();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevTestimonial();
    }
  }

  /** Só troca slide em gesto horizontal claro; vertical segue rolando a página. */
  private handleHorizontalSwipe(deltaX: number, deltaY: number): void {
    if (Math.abs(deltaX) < this.swipeThreshold) return;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    deltaX < 0 ? this.nextTestimonial() : this.prevTestimonial();
  }

  whatsAppLink(message: string): string {
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  readonly msgHero =
    'Olá, Daniel Victor! Vim pelo site e quero começar minha consultoria online. Pode me contar como funciona?';

  readonly msgPlanos =
    'Olá! Gostaria de conhecer os planos da consultoria (BASE, EVOLVE, ELITE, DIAMANTE e BÁSICO ANUAL) e saber qual combina com meu objetivo.';

  readonly msgAvaliacao =
    'Olá! Quero iniciar minha avaliação física (anamnese e questionário de aptidão). Como faço?';

  readonly msgFooter =
    'Olá, Daniel Victor! Tenho uma dúvida sobre a consultoria online e gostaria de falar com você.';

  readonly plans: Plan[] = [
    {
      id: 'base',
      name: 'BASE',
      price: '179,99',
      priceSuffix: '/mês',
      tagline: 'Construa sua melhor versão.',
      description:
        'Treinamento personalizado para quem quer começar a evoluir com estratégia.',
      features: [
        'Treino personalizado conforme objetivo e nível',
        'Treino pelo canal definido pelo personal',
        'Vídeos demonstrando os exercícios no canal definido',
        'Divisão semanal dos treinos',
        'Orientações de execução e técnicas por escrito',
        'Suporte prioritário no WhatsApp',
        'Ajustes programados a cada 30 dias',
        'Reunião ao vivo para dúvidas e alinhamento',
      ],
      whatsappMessage:
        'Olá, Daniel Victor! Quero assinar o plano BASE (R$ 179,99/mês). Pode me orientar sobre o próximo passo?',
    },
    {
      id: 'evolve',
      name: 'EVOLVE',
      price: '279,99',
      priceSuffix: '/mês',
      tagline: 'Treine com técnica. Evolua com propósito.',
      description: 'Todos os benefícios do BASE, com periodização e conteúdo avançado.',
      features: [
        'Todos os benefícios do plano BASE',
        'Biblioteca exclusiva de vídeos sobre técnicas de execução',
        'Demonstrações de exercícios e equipamentos',
        'Conteúdos sobre amplitude, controle do movimento e erros comuns',
        'Orientações sobre progressão de cargas e intensidade',
        'Acesso aos vídeos enquanto a assinatura estiver ativa',
        'Periodização de treinamento inteligente',
        'Estratégia dividida em fases para intensificar o desenvolvimento',
        'Avaliações periódicas e relatórios de evolução',
        'Histórico completo do aluno',
        'Reunião ao vivo para feedback e alinhar estratégias',
      ],
      whatsappMessage:
        'Olá, Daniel Victor! Tenho interesse no plano EVOLVE (R$ 279,99/mês). Quero saber como começar.',
    },
    {
      id: 'elite',
      name: 'ELITE',
      price: '499,99',
      priceSuffix: '/mês',
      tagline: 'Estratégia completa para ir além.',
      description: 'Todos os benefícios do EVOLVE, com nutrição e videochamada mensal.',
      features: [
        'Todos os benefícios do plano EVOLVE',
        'Acompanhamento nutricional com nutricionista da equipe',
        'Anamnese de saúde e planejamento alimentar personalizado',
        'Atualização do planejamento alimentar a cada mês',
        'Aula online 1x por mês (1h) por videochamada',
        'Análise da prática no treinamento ao vivo',
      ],
      whatsappMessage:
        'Olá, Daniel Victor! Quero o plano ELITE (R$ 499,99/mês) com nutri e videochamada. Como funciona a contratação?',
    },
    {
      id: 'diamante',
      name: 'Plano Diamante',
      price: '1.497',
      priceSuffix: 'à vista',
      duration: '3 meses',
      tagline: 'Periodização completa com acompanhamento de alto nível.',
      description: 'Investimento único para 3 meses de consultoria com nutrição e análise de vídeos.',
      features: [
        'Periodização de 3 meses',
        'Acompanhamento nutricional',
        'Planejamento dividido em fases',
        'Reavaliações periódicas',
        'Comparação de evolução',
        'Relatórios de acompanhamento',
        'Ajustes individualizados conforme evolução',
        'Estratégia de progressão de carga',
        'Estratégia de cardio',
        'Ajustes de volume e intensidade',
        'Análise de vídeos de execução',
        'Suporte via WhatsApp',
        'Atendimento prioritário',
        'Revisão de metas durante o processo',
        'Planejamento das próximas etapas',
        'Aula online 1x por mês',
      ],
      whatsappMessage:
        'Olá, Daniel Victor! Quero contratar o Plano Diamante (3 meses, R$ 1.497 à vista). Pode me passar os detalhes?',
    },
    {
      id: 'basico-anual',
      name: 'Plano Básico Anual',
      price: '2.997',
      priceSuffix: 'à vista',
      duration: '12 meses',
      tagline: 'Um ano de planejamento e evolução contínua.',
      description: 'Investimento à vista com periodização anual e acompanhamento de performance.',
      features: [
        'Planejamento anual',
        'Periodização de 12 meses',
        'Estratégia dividida em diferentes fases',
        'Avaliações periódicas',
        'Relatórios de evolução',
        'Histórico completo do aluno',
        'Ajustes contínuos do treinamento',
        'Estratégias específicas para diferentes objetivos',
        'Revisão periódica de metas',
        'Acompanhamento de performance',
        'Análise técnica de execução',
        'Suporte prioritário',
        'Planejamento das próximas fases',
        'Aula online 1x no mês',
      ],
      whatsappMessage:
        'Olá, Daniel Victor! Tenho interesse no Plano Básico Anual (12 meses, R$ 2.997 à vista). Como faço para começar?',
    },
  ];
}
