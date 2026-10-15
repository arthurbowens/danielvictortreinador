export type AnamneseStepType = 'text' | 'choice';

export interface AnamneseStep {
  key: string;
  prompt: (answers: Record<string, string>) => string;
  type: AnamneseStepType;
  placeholder?: string;
  choices?: string[];
}

export const ANAMNESE_INTRO_LINES = [
  'Oi! Somos da consultoria do Daniel Victor 🔥 Vamos fazer uma anamnese bem prática, para te conhecer melhor e traçar o caminho mais específico para teu objetivo 🚀',
];

export const ANAMNESE_STEPS: AnamneseStep[] = [
  {
    key: 'nome',
    prompt: () => 'Sou o Daniel Victor. Como você se chama?',
    type: 'text',
    placeholder: 'Seu nome',
  },
  {
    key: 'idade',
    prompt: (a) => `Prazer, ${a['nome']}! Qual a sua idade?`,
    type: 'text',
    placeholder: 'Ex.: 28',
  },
  {
    key: 'altura',
    prompt: () => 'Qual sua altura? Em centímetros.',
    type: 'text',
    placeholder: 'Ex.: 173 cm',
  },
  {
    key: 'peso',
    prompt: () => 'E seu peso atual em kg?',
    type: 'text',
    placeholder: 'Ex.: 70 kg',
  },
  {
    key: 'objetivo',
    prompt: () => 'E qual seu principal objetivo com os treinos?',
    type: 'choice',
    choices: [
      'Emagrecimento',
      'Hipertrofia',
      'Condicionamento',
      'Reabilitação',
      'Treinamento feminino',
      'Performance para corredores',
      'Outro',
    ],
  },
  {
    key: 'experiencia',
    prompt: () => 'Você já treina? Quanto tempo?',
    type: 'choice',
    choices: ['Menos de 3 meses', '3 a 12 meses', '1 a 3 anos', 'Mais de 3 anos'],
  },
  {
    key: 'frequencia',
    prompt: () => 'Quantas vezes por semana você consegue treinar?',
    type: 'choice',
    choices: ['2x por semana', '3x por semana', '4x por semana', '5x ou mais'],
  },
  {
    key: 'modalidade',
    prompt: () => 'Qual modalidade de atendimento você prefere?',
    type: 'choice',
    choices: ['Presencial', 'Híbrido', 'Online'],
  },
  {
    key: 'restricoes',
    prompt: () => 'Possui alguma restrição médica? Lesão ou dor que devemos considerar?',
    type: 'text',
    placeholder: 'Ex.: Nenhuma',
  },
  {
    key: 'dificuldade',
    prompt: () => 'Por último, qual sua maior dificuldade hoje?',
    type: 'choice',
    choices: ['Consistência', 'Alimentação', 'Falta de tempo', 'Técnica nos exercícios'],
  },
];

export function buildAnamneseWhatsAppMessage(answers: Record<string, string>): string {
  const lines = [
    'Olá, Daniel Victor! Concluí a anamnese no site. Seguem meus dados:',
    '',
    `Nome: ${answers['nome'] ?? '-'}`,
    `Idade: ${answers['idade'] ?? '-'}`,
    `Altura: ${answers['altura'] ?? '-'}`,
    `Peso: ${answers['peso'] ?? '-'}`,
    `Objetivo: ${answers['objetivo'] ?? '-'}`,
    `Tempo de treino: ${answers['experiencia'] ?? '-'}`,
    `Frequência semanal: ${answers['frequencia'] ?? '-'}`,
    `Modalidade: ${answers['modalidade'] ?? '-'}`,
    `Restrições/lesões: ${answers['restricoes'] ?? '-'}`,
    `Maior dificuldade: ${answers['dificuldade'] ?? '-'}`,
    '',
    'Gostaria de dar continuidade à avaliação e conhecer os planos.',
  ];
  return lines.join('\n');
}
