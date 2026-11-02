import { Component, OnDestroy, signal } from '@angular/core';
import {
  ANAMNESE_INTRO_LINES,
  ANAMNESE_STEPS,
  AnamneseStep,
  buildAnamneseWhatsAppMessage,
} from './anamnese-assistant.data';

export interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

export interface Testimonial {
  id: string;
  name: string;
  messages: string[];
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  priceSuffix: string;
  tagline: string;
  description: string[];
  sections: PlanSection[];
  closing: string;
  /** Texto de "Qual plano combina com você?". */
  fit: string;
  whatsappMessage: string;
}

export interface PlanSection {
  title: string;
  items: string[];
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  /** Número com DDI + DDD, somente dígitos. */
  readonly whatsappPhone = '5511958727755';

  readonly testimonials: Testimonial[] = [
    {
      id: 'valeria',
      name: 'Valéria de Jesus',
      messages: [
        'Muito ilusão da minha parte achar que seria um sumô comum kkkkkkkkkkkkkk',
        'Obrigada',
        'Boa semana 😘',
        'Mas eu fiz esse segundo vídeo! Vou manter ele',
        'O treino tá top gostei bastante',
        'Parabéns pelo seu dia e o bom profissional que é!',
      ],
    },
    {
      id: 'nabi-treino',
      name: 'Nabi Oliveira dos Santos',
      messages: [
        'Olá Daniel, boa noite',
        'tudo bem com você?',
        'acabei de bater o olho no treino e gostei demais',
        'parabéns pelo trabalho',
        'muito obrigado',
      ],
    },
    {
      id: 'aparecido',
      name: 'Aparecido Marinho Gonçalves',
      messages: [
        'Daniel, vc é fera mesmo hein...',
        'Desde que comecei seus treinos melhorei força, definição, disposição...',
        'E esses treinos me deixam no pump!!!',
        'Muito bom, treinos desafiadores, curtos e eficientes, ainda bem que te encontrei',
        'Um abraço cara',
        'Qdo o profissional é bom a gente tem que elogiar. Parabéns',
      ],
    },
    {
      id: 'nabi-suporte',
      name: 'Nabi Oliveira dos Santos',
      messages: [
        'cara',
        'show',
        'muito obrigado',
        'gostei bastante do treino hoje e de toda sua atenção e suporte',
        'tá de parabéns',
      ],
    },
  ];

  readonly activeTestimonial = signal(0);
  readonly mobileMenuOpen = signal(false);

  readonly anamneseSteps = ANAMNESE_STEPS;
  readonly anamneseTotalSteps = ANAMNESE_STEPS.length;
  readonly anamneseChatOpen = signal(false);
  readonly anamneseMessages = signal<ChatMessage[]>([]);
  readonly anamneseStepIndex = signal(0);
  readonly anamneseAnswers = signal<Record<string, string>>({});
  readonly anamneseComplete = signal(false);
  readonly anamneseInitialized = signal(false);
  readonly chatInput = signal('');
  readonly anamneseChatStyle = signal<Record<string, string>>({});
  readonly anamneseChatMobileFit = signal(false);

  private touchStartX = 0;
  private touchStartY = 0;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerActive = false;
  private readonly swipeThreshold = 48;
  private chatMessageSeq = 0;
  private anamneseSubmitting = false;
  private chatViewportCleanup?: () => void;

  ngOnDestroy(): void {
    this.unbindChatViewport();
  }

  carouselTransform(): string {
    const index = this.activeTestimonial();
    const offset = (100 / this.testimonials.length) * index;
    return `translate3d(-${offset}%, 0, 0)`;
  }

  carouselSlideBasis(): string {
    return `${100 / this.testimonials.length}%`;
  }

  testimonialInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
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

  currentAnamneseStep(): AnamneseStep | null {
    if (this.anamneseComplete()) return null;
    return this.anamneseSteps[this.anamneseStepIndex()] ?? null;
  }

  anamneseProgressLabel(): string {
    if (this.anamneseComplete()) return 'Anamnese concluída';
    return `Pergunta ${this.anamneseStepIndex() + 1} de ${this.anamneseTotalSteps}`;
  }

  currentAnamnesePrompt(): string {
    const step = this.currentAnamneseStep();
    if (!step) return '';
    return step.prompt(this.anamneseAnswers());
  }

  anamneseWhatsAppUrl(): string {
    return this.whatsAppLink(buildAnamneseWhatsAppMessage(this.anamneseAnswers()));
  }

  openAnamneseChat(): void {
    if (!this.anamneseInitialized()) {
      this.startAnamneseConversation();
      this.anamneseInitialized.set(true);
    } else {
      this.syncCurrentQuestionInChat();
    }
    this.anamneseChatOpen.set(true);
    this.bindChatViewport();
    this.scheduleChatScroll();
  }

  closeAnamneseChat(): void {
    this.anamneseChatOpen.set(false);
    this.unbindChatViewport();
  }

  toggleAnamneseChat(): void {
    if (this.anamneseChatOpen()) {
      this.closeAnamneseChat();
    } else {
      this.openAnamneseChat();
    }
  }

  onChatInput(event: Event): void {
    this.chatInput.set((event.target as HTMLInputElement).value);
  }

  sendChatInput(): void {
    const value = this.chatInput().trim();
    if (!value) return;
    this.submitAnamneseAnswer(value);
    this.chatInput.set('');
  }

  onChatInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendChatInput();
    }
  }

  onChatInputFocus(): void {
    this.syncAnamneseChatToVisualViewport();
    this.scheduleChatScroll();
    if (typeof window === 'undefined') return;
    window.setTimeout(() => this.syncAnamneseChatToVisualViewport(), 280);
    window.setTimeout(() => this.scheduleChatScroll(), 320);
  }

  private bindChatViewport(): void {
    if (typeof window === 'undefined') return;
    this.unbindChatViewport();

    const update = () => this.syncAnamneseChatToVisualViewport();
    update();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
      this.chatViewportCleanup = () => {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        window.removeEventListener('orientationchange', update);
      };
      return;
    }

    this.chatViewportCleanup = () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }

  private unbindChatViewport(): void {
    this.chatViewportCleanup?.();
    this.chatViewportCleanup = undefined;
    this.anamneseChatStyle.set({});
    this.anamneseChatMobileFit.set(false);
  }

  private syncAnamneseChatToVisualViewport(): void {
    if (typeof window === 'undefined' || !this.anamneseChatOpen()) return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) {
      this.anamneseChatStyle.set({});
      this.anamneseChatMobileFit.set(false);
      return;
    }

    const vv = window.visualViewport;
    const gap = 8;
    const width = vv ? vv.width : window.innerWidth;
    const height = vv ? vv.height : window.innerHeight;
    const offsetTop = vv?.offsetTop ?? 0;
    const offsetLeft = vv?.offsetLeft ?? 0;

    this.anamneseChatMobileFit.set(true);
    this.anamneseChatStyle.set({
      top: `${offsetTop + gap}px`,
      left: `${offsetLeft + gap}px`,
      width: `${Math.max(0, width - gap * 2)}px`,
      height: `${Math.max(220, height - gap * 2)}px`,
      bottom: 'auto',
      right: 'auto',
      maxHeight: 'none',
      marginLeft: '0',
      marginRight: '0',
    });
  }

  chooseAnamneseOption(option: string): void {
    this.submitAnamneseAnswer(option);
  }

  private startAnamneseConversation(): void {
    this.chatMessageSeq = 0;
    const messages: ChatMessage[] = ANAMNESE_INTRO_LINES.map((text) => this.createChatMessage('bot', text));
    const first = ANAMNESE_STEPS[0];
    messages.push(this.createChatMessage('bot', first.prompt({})));
    this.anamneseMessages.set(messages);
    this.anamneseStepIndex.set(0);
    this.anamneseAnswers.set({});
    this.anamneseComplete.set(false);
    this.chatInput.set('');
    this.anamneseSubmitting = false;
  }

  private createChatMessage(from: 'bot' | 'user', text: string): ChatMessage {
    return { id: ++this.chatMessageSeq, from, text };
  }

  private syncCurrentQuestionInChat(): void {
    if (this.anamneseComplete()) return;
    const prompt = this.currentAnamnesePrompt();
    if (!prompt) return;

    const messages = this.anamneseMessages();
    const lastBot = [...messages].reverse().find((message) => message.from === 'bot');
    if (lastBot?.text === prompt) return;

    this.anamneseMessages.update((current) => [...current, this.createChatMessage('bot', prompt)]);
  }

  private scheduleChatScroll(): void {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => this.scrollChatToBottom(), 0);
    window.setTimeout(() => this.scrollChatToBottom(), 120);
  }

  private scrollChatToBottom(): void {
    if (typeof document === 'undefined') return;
    const body = document.querySelector('.anamnese-chat__body');
    if (body instanceof HTMLElement) {
      body.scrollTop = body.scrollHeight;
    }
  }

  private openAnamneseWhatsApp(answers: Record<string, string>): void {
    const url = this.whatsAppLink(buildAnamneseWhatsAppMessage(answers));
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 500);
  }

  private submitAnamneseAnswer(raw: string): void {
    const value = raw.trim();
    if (!value || this.anamneseComplete() || this.anamneseSubmitting) return;

    const step = this.currentAnamneseStep();
    if (!step) return;

    this.anamneseSubmitting = true;
    const answers = { ...this.anamneseAnswers(), [step.key]: value };
    this.anamneseAnswers.set(answers);

    const userMessage = this.createChatMessage('user', value);
    const nextIndex = this.anamneseStepIndex() + 1;

    if (nextIndex >= this.anamneseSteps.length) {
      const name = answers['nome'] ?? '';
      this.anamneseComplete.set(true);
      this.anamneseStepIndex.set(nextIndex);
      this.anamneseMessages.update((messages) => [
        ...messages,
        userMessage,
        this.createChatMessage(
          'bot',
          `Perfeito${name ? `, ${name}` : ''}! Abrindo o WhatsApp com suas respostas...`,
        ),
      ]);
      this.scheduleChatScroll();
      this.openAnamneseWhatsApp(answers);
      this.anamneseSubmitting = false;
      return;
    }

    const nextStep = this.anamneseSteps[nextIndex];
    const nextQuestion = this.createChatMessage('bot', nextStep.prompt(answers));
    this.anamneseStepIndex.set(nextIndex);
    this.anamneseMessages.update((messages) => [...messages, userMessage, nextQuestion]);
    this.scheduleChatScroll();
    this.anamneseSubmitting = false;
  }

  readonly msgHero =
    'Olá, Daniel Victor! Vim pelo site e quero começar minha consultoria online. Pode me contar como funciona?';

  readonly msgPlanos =
    'Olá! Gostaria de conhecer os planos da consultoria (Kettlebell Total, BASE, EVOLVE e ELITE) e saber qual combina com meu objetivo.';

  readonly msgAvaliacao =
    'Olá! Quero iniciar minha avaliação física (anamnese e questionário de aptidão). Como faço?';

  readonly msgFooter =
    'Olá, Daniel Victor! Tenho uma dúvida sobre a consultoria online e gostaria de falar com você.';

  readonly plans: Plan[] = [
    {
      id: 'kettlebell-total',
      name: 'Kettlebell Total',
      price: '147,90',
      priceSuffix: '/mês',
      tagline: 'Treinamento inteligente para quem busca praticidade, eficiência e liberdade para treinar.',
      description: [
        'O Kettlebell Total é um programa de treinamento personalizado com foco no uso do kettlebell e do peso corporal, ideal para adultos que desejam otimizar o tempo e treinar em casa ou na área de pesos livres da academia, sem depender de máquinas ou de uma grande variedade de equipamentos.',
        'O planejamento é adaptado ao seu nível de condicionamento, às suas necessidades e aos seus objetivos, com acompanhamento profissional e progressão estruturada.',
      ],
      sections: [
        {
          title: 'Protocolos de treinamento',
          items: [
            'Força muscular: desenvolvimento da força e da capacidade de realizar movimentos com eficiência.',
            'Condicionamento metabólico: sessões planejadas para aumentar a demanda energética e contribuir para o gasto calórico.',
            'Mobilidade: exercícios voltados à melhora da amplitude de movimento e do controle corporal.',
          ],
        },
        {
          title: 'O que você recebe',
          items: [
            'Planejamento de treinamento individualizado.',
            'Exercícios com kettlebell e peso corporal.',
            'Prescrição de séries, repetições, intervalos e orientações de execução.',
            'Biblioteca de vídeos com demonstrações das técnicas de execução com kettlebell.',
            'Adaptações para iniciantes e praticantes intermediários.',
            'Progressão planejada de acordo com sua evolução.',
            'Acompanhamento profissional e ajustes no planejamento.',
            'Atualização do treino a cada 30 dias.',
            'Acesso à plataforma enquanto a assinatura estiver ativa.',
            'Reunião ao vivo para esclarecer dúvidas e alinhar as estratégias do treinamento.',
          ],
        },
      ],
      closing: 'Praticidade para treinar. Estratégia para evoluir.',
      fit: 'para quem busca praticidade e quer treinar com kettlebell e peso corporal.',
      whatsappMessage:
        'Olá, Daniel Victor! Tenho interesse no plano Kettlebell Total (R$ 147,90/mês). Quero saber como começar.',
    },
    {
      id: 'base',
      name: 'BASE',
      price: '197,90',
      priceSuffix: '/mês',
      tagline: 'Treine com técnica. Evolua com propósito.',
      description: [
        'Um plano de consultoria para quem deseja desenvolver seu condicionamento físico com um treinamento individualizado, estruturado de acordo com seus objetivos, seu nível de experiência e sua rotina.',
        'Aqui, cada etapa do treinamento tem um propósito: você sabe o que fazer, como executar os exercícios e como progredir ao longo do processo.',
      ],
      sections: [
        {
          title: 'Indicado para objetivos como',
          items: [
            'Hipertrofia muscular.',
            'Preparação física complementar para corredores.',
            'Retorno progressivo aos exercícios, respeitando as orientações de profissionais de saúde quando necessário.',
            'Treinamento feminino personalizado.',
            'Desenvolvimento do condicionamento físico e da força.',
          ],
        },
        {
          title: 'O que você recebe',
          items: [
            'Treinamento personalizado conforme seus objetivos e seu nível de condicionamento.',
            'Planejamento estruturado com periodização do treinamento.',
            'Estratégia de evolução dividida em fases, de acordo com as necessidades individuais.',
            'Prescrição dos exercícios por meio do canal ou da plataforma definidos pelo personal trainer.',
            'Biblioteca exclusiva de vídeos com demonstrações de exercícios e utilização de equipamentos.',
            'Orientações sobre amplitude de movimento, controle da execução e erros comuns.',
            'Diretrizes para progressão de cargas e ajuste da intensidade.',
            'Atualização do planejamento de treino a cada 45 dias.',
            'Relatórios de evolução e histórico do treinamento.',
            'Acesso aos vídeos enquanto a assinatura estiver ativa.',
            'Reunião ao vivo para feedback, esclarecimento de dúvidas e alinhamento das próximas estratégias.',
          ],
        },
      ],
      closing: 'Um plano estruturado para transformar esforço em evolução consistente.',
      fit: 'para quem deseja um treinamento individualizado, com periodização e acompanhamento profissional.',
      whatsappMessage:
        'Olá, Daniel Victor! Quero assinar o plano BASE (R$ 197,90/mês). Pode me orientar sobre o próximo passo?',
    },
    {
      id: 'evolve',
      name: 'EVOLVE',
      price: '297,90',
      priceSuffix: '/mês',
      tagline: 'Treinamento e estratégia nutricional para uma abordagem mais completa.',
      description: [
        'Para quem deseja ir além do planejamento de treino e contar também com orientação nutricional profissional, integrando as estratégias de treinamento e alimentação.',
        'O EVOLVE reúne todos os benefícios do plano BASE e acrescenta suporte nutricional realizado por profissional habilitado.',
      ],
      sections: [
        {
          title: 'Todos os benefícios do plano BASE, mais:',
          items: [
            'Acompanhamento nutricional individualizado.',
            'Planejamento alimentar elaborado por nutricionista da equipe, conforme avaliação individual.',
            'Anamnese e levantamento de informações relevantes para a elaboração do planejamento alimentar.',
            'Atualização do planejamento de treino e do planejamento alimentar a cada 45 dias, conforme avaliação profissional e necessidade individual.',
          ],
        },
      ],
      closing: 'Treine com estratégia. Alimente seus objetivos. Evolua com consistência.',
      fit: 'para quem quer integrar o treinamento a um planejamento alimentar elaborado por nutricionista.',
      whatsappMessage:
        'Olá, Daniel Victor! Tenho interesse no plano EVOLVE (R$ 297,90/mês). Quero saber como começar.',
    },
    {
      id: 'elite',
      name: 'ELITE',
      price: '397,90',
      priceSuffix: '/mês',
      tagline: 'Acompanhamento mais próximo para aprimorar sua execução e sua evolução.',
      description: [
        'Para quem deseja uma experiência mais completa, com todos os benefícios do plano EVOLVE e sessões ao vivo para trabalhar a técnica, esclarecer dúvidas e aperfeiçoar a prática dos exercícios.',
      ],
      sections: [
        {
          title: 'Todos os benefícios do plano EVOLVE, mais:',
          items: [
            'Duas aulas online por mês.',
            'Uma hora de acompanhamento por videochamada, conforme a organização das sessões.',
            'Análise da execução dos exercícios durante as aulas.',
            'Correções técnicas ao vivo, dentro das possibilidades de observação por vídeo.',
            'Feedback individualizado para aprimorar a qualidade e a eficiência dos movimentos.',
            'Orientações práticas para melhorar o desempenho e aplicar as estratégias do treinamento.',
            'Reuniões para esclarecer dúvidas e alinhar as próximas etapas do planejamento.',
          ],
        },
      ],
      closing: 'Mais proximidade, mais orientação e uma estratégia alinhada à sua evolução.',
      fit: 'para quem busca todos os benefícios do EVOLVE com aulas online e acompanhamento técnico ao vivo.',
      whatsappMessage:
        'Olá, Daniel Victor! Quero o plano ELITE (R$ 397,90/mês). Como funciona a contratação?',
    },
  ];
}
