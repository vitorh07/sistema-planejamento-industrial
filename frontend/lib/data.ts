import type { Activity, PhaseName, Product, Project, Sector } from './types'

/**
 * Base fictícia centralizada. Para integrar dados reais, substitua estas
 * listas por chamadas à API (FastAPI/PostgreSQL) mantendo os mesmos formatos.
 */

export const TODAY = '2026-10-12'

/** Horas produtivas disponíveis por funcionário fixo em um mês. */
export const PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH = 140

/** Limites de classificação da ocupação (%). */
export const CAPACITY_THRESHOLDS = {
  attention: 85,
  overload: 100,
}

export const PLANNING_MONTHS = [
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
  '2026-11',
  '2026-12',
  '2027-01',
  '2027-02',
  '2027-03',
]

export const PHASES: PhaseName[] = [
  'Planejamento',
  'Engenharia',
  'Fabricação',
  'Execução em campo',
  'Encerramento',
]

export const PRODUCTS: Product[] = [
  { id: 'FV', name: 'Fachada Ventilada' },
  { id: 'PA', name: 'Painel Acústico' },
  { id: 'DM', name: 'Divisória Modular' },
  { id: 'FM', name: 'Forro Metálico' },
]

export const SECTORS: Sector[] = [
  { id: 'CRT', name: 'Corte', fixedEmployees: 9 },
  { id: 'USI', name: 'Usinagem e Dobra', fixedEmployees: 11 },
  { id: 'SOL', name: 'Soldagem', fixedEmployees: 3 },
  { id: 'PIN', name: 'Pintura', fixedEmployees: 8 },
  { id: 'MON', name: 'Montagem', fixedEmployees: 9 },
  { id: 'INS', name: 'Instalação (campo)', fixedEmployees: 16 },
]

export const ACTIVITIES: Activity[] = [
  // Fachada Ventilada
  { id: 'FV-01', product: 'FV', phase: 'Fabricação', stage: 'Corte de chapas ACM', sector: 'CRT', laborClass: 'Operador de CNC', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.35, notes: 'Inclui otimização de plano de corte' },
  { id: 'FV-02', product: 'FV', phase: 'Fabricação', stage: 'Fresagem e dobra', sector: 'USI', laborClass: 'Dobrador', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.45, notes: '' },
  { id: 'FV-03', product: 'FV', phase: 'Fabricação', stage: 'Pintura de subestrutura', sector: 'PIN', laborClass: 'Pintor industrial', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.25, notes: 'Somente perfis aparentes' },
  { id: 'FV-04', product: 'FV', phase: 'Fabricação', stage: 'Pré-montagem de cassetes', sector: 'MON', laborClass: 'Montador', referencePeople: 3, category: 'fabricacao', hoursPerM2: 0.3, notes: '' },
  { id: 'FV-05', product: 'FV', phase: 'Execução em campo', stage: 'Setup de obra', sector: 'INS', laborClass: 'Encarregado de obra', referencePeople: 2, category: 'setup', directHours: 120, notes: 'Horas fixas por obra (informadas)' },
  { id: 'FV-06', product: 'FV', phase: 'Execução em campo', stage: 'Instalação de fachada', sector: 'INS', laborClass: 'Instalador', referencePeople: 6, category: 'instalacao', hoursPerM2: 0.6, notes: 'Exige plataforma elevatória' },

  // Painel Acústico
  { id: 'PA-01', product: 'PA', phase: 'Fabricação', stage: 'Corte de painéis', sector: 'CRT', laborClass: 'Operador de serra', referencePeople: 1, category: 'fabricacao', hoursPerM2: 0.2, notes: '' },
  { id: 'PA-02', product: 'PA', phase: 'Fabricação', stage: 'Pintura e acabamento', sector: 'PIN', laborClass: 'Pintor industrial', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.15, notes: '' },
  { id: 'PA-03', product: 'PA', phase: 'Fabricação', stage: 'Colagem e montagem', sector: 'MON', laborClass: 'Montador', referencePeople: 4, category: 'fabricacao', hoursPerM2: 0.5, notes: 'Cura de cola de 24h' },
  { id: 'PA-04', product: 'PA', phase: 'Execução em campo', stage: 'Setup de obra', sector: 'INS', laborClass: 'Encarregado de obra', referencePeople: 1, category: 'setup', directHours: 60, notes: 'Horas fixas por obra (informadas)' },
  { id: 'PA-05', product: 'PA', phase: 'Execução em campo', stage: 'Instalação de painéis', sector: 'INS', laborClass: 'Instalador', referencePeople: 4, category: 'instalacao', hoursPerM2: 0.4, notes: '' },

  // Divisória Modular
  { id: 'DM-01', product: 'DM', phase: 'Fabricação', stage: 'Corte de perfis', sector: 'CRT', laborClass: 'Operador de serra', referencePeople: 1, category: 'fabricacao', hoursPerM2: 0.25, notes: '' },
  { id: 'DM-02', product: 'DM', phase: 'Fabricação', stage: 'Usinagem de montantes', sector: 'USI', laborClass: 'Operador de CNC', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.3, notes: '' },
  { id: 'DM-03', product: 'DM', phase: 'Fabricação', stage: 'Soldagem de quadros', sector: 'SOL', laborClass: 'Soldador', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.35, notes: 'Gargalo recorrente' },
  { id: 'DM-04', product: 'DM', phase: 'Fabricação', stage: 'Montagem de módulos', sector: 'MON', laborClass: 'Montador', referencePeople: 3, category: 'fabricacao', hoursPerM2: 0.4, notes: '' },
  { id: 'DM-05', product: 'DM', phase: 'Execução em campo', stage: 'Setup de obra', sector: 'INS', laborClass: 'Encarregado de obra', referencePeople: 1, category: 'setup', directHours: 80, notes: 'Horas fixas por obra (informadas)' },
  { id: 'DM-06', product: 'DM', phase: 'Execução em campo', stage: 'Instalação de divisórias', sector: 'INS', laborClass: 'Instalador', referencePeople: 4, category: 'instalacao', hoursPerM2: 0.5, notes: '' },

  // Forro Metálico
  { id: 'FM-01', product: 'FM', phase: 'Fabricação', stage: 'Corte de bobinas', sector: 'CRT', laborClass: 'Operador de CNC', referencePeople: 1, category: 'fabricacao', hoursPerM2: 0.15, notes: '' },
  { id: 'FM-02', product: 'FM', phase: 'Fabricação', stage: 'Perfilagem e furação', sector: 'USI', laborClass: 'Operador de perfiladeira', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.2, notes: '' },
  { id: 'FM-03', product: 'FM', phase: 'Fabricação', stage: 'Pintura eletrostática', sector: 'PIN', laborClass: 'Pintor industrial', referencePeople: 2, category: 'fabricacao', hoursPerM2: 0.2, notes: 'Forno com capacidade limitada' },
  { id: 'FM-04', product: 'FM', phase: 'Execução em campo', stage: 'Setup de obra', sector: 'INS', laborClass: 'Encarregado de obra', referencePeople: 1, category: 'setup', directHours: 50, notes: 'Horas fixas por obra (informadas)' },
  { id: 'FM-05', product: 'FM', phase: 'Execução em campo', stage: 'Instalação de forro', sector: 'INS', laborClass: 'Instalador', referencePeople: 5, category: 'instalacao', hoursPerM2: 0.35, notes: '' },
]

export const PROJECTS: Project[] = [
  { id: 'PRJ-101', name: 'Edifício Aurora', client: 'Construtora Alfa', product: 'FV', priority: 'Média', start: '2026-05-04', phaseWeeks: [2, 3, 8, 6, 1], areaM2: 1800, performance: 1.04 },
  { id: 'PRJ-102', name: 'Hospital São Lucas', client: 'Rede Saúde Mais', product: 'PA', priority: 'Alta', start: '2026-06-01', phaseWeeks: [2, 3, 8, 7, 1], areaM2: 2400, performance: 0.97 },
  { id: 'PRJ-103', name: 'Centro Corporativo Vértice', client: 'Vértice Empreendimentos', product: 'DM', priority: 'Alta', start: '2026-06-15', phaseWeeks: [2, 4, 9, 6, 1], areaM2: 1500, delayedPhase: 'Fabricação', performance: 0.72 },
  { id: 'PRJ-104', name: 'Shopping Vale Verde', client: 'Grupo Vale', product: 'FV', priority: 'Alta', start: '2026-07-06', phaseWeeks: [2, 3, 10, 8, 1], areaM2: 3200, performance: 1.02 },
  { id: 'PRJ-105', name: 'Aeroporto Regional Norte', client: 'Infra Aeroportos', product: 'FM', priority: 'Alta', start: '2026-07-20', phaseWeeks: [2, 4, 8, 8, 1], areaM2: 4000, performance: 0.95 },
  { id: 'PRJ-106', name: 'Escola Técnica Horizonte', client: 'Instituto Horizonte', product: 'PA', priority: 'Baixa', start: '2026-05-18', phaseWeeks: [2, 2, 6, 4, 1], areaM2: 1200, performance: 1.08 },
  { id: 'PRJ-107', name: 'Torre Residencial Mirante', client: 'Construtora Alfa', product: 'FV', priority: 'Média', start: '2026-08-03', phaseWeeks: [2, 3, 9, 7, 1], areaM2: 2200, performance: 1.0 },
  { id: 'PRJ-108', name: 'Sede Administrativa Lumen', client: 'Lumen Energia', product: 'DM', priority: 'Média', start: '2026-09-07', phaseWeeks: [2, 3, 8, 5, 1], areaM2: 1600, performance: 0.98 },
  { id: 'PRJ-109', name: 'Arena Multiuso Delta', client: 'Delta Esportes', product: 'FM', priority: 'Média', start: '2026-10-26', phaseWeeks: [2, 3, 8, 6, 1], areaM2: 2800, performance: 1.0 },
  {
    id: 'PRJ-110',
    name: 'Retrofit Hotel Atlântico',
    client: 'Atlântico Hotéis',
    product: 'FV',
    priority: 'Alta',
    start: '2026-07-13',
    phaseWeeks: [1, 2, 6, 5, 1],
    areaM2: null,
    directHours: { 'FV-01': 260, 'FV-02': 340, 'FV-03': 180, 'FV-04': 220, 'FV-05': 90, 'FV-06': 520 },
    delayedPhase: 'Fabricação',
    performance: 0.78,
  },
  { id: 'PRJ-111', name: 'Clínica Bem Estar', client: 'Rede Saúde Mais', product: 'PA', priority: 'Baixa', start: '2026-11-09', phaseWeeks: [2, 2, 5, 4, 1], areaM2: 900, performance: 1.0 },
]
