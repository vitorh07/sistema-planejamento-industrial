export type ProductId = 'FV' | 'PA' | 'DM' | 'FM'
export type SectorId = 'CRT' | 'USI' | 'SOL' | 'PIN' | 'MON' | 'INS'

export type PhaseName =
  | 'Planejamento'
  | 'Engenharia'
  | 'Fabricação'
  | 'Execução em campo'
  | 'Encerramento'

export type HoursCategory = 'fabricacao' | 'setup' | 'instalacao'

export type ProjectStatus = 'Planejado' | 'Em andamento' | 'Concluído' | 'Atrasado'
export type PhaseStatus = 'Planejada' | 'Em andamento' | 'Concluída' | 'Atrasada'
export type Priority = 'Alta' | 'Média' | 'Baixa'
export type CapacityStatus = 'Disponível' | 'Atenção' | 'Sobrecarga'

export interface Product {
  id: ProductId
  name: string
}

export interface Sector {
  id: SectorId
  name: string
  fixedEmployees: number
}

/** Atividade padrão de um produto. Define como as horas previstas são obtidas. */
export interface Activity {
  id: string
  product: ProductId
  phase: Extract<PhaseName, 'Fabricação' | 'Execução em campo'>
  stage: string
  sector: SectorId
  laborClass: string
  /** Referência operacional: NÃO representa funcionários únicos do setor. */
  referencePeople: number
  category: HoursCategory
  hoursPerM2?: number
  directHours?: number
  notes: string
}

export interface Project {
  id: string
  name: string
  client: string
  product: ProductId
  priority: Priority
  start: string
  /** Duração em semanas de cada fase, na ordem de PHASES. */
  phaseWeeks: [number, number, number, number, number]
  areaM2: number | null
  /** Horas informadas diretamente por atividade (sobrepõe o cálculo por índice). */
  directHours?: Record<string, number>
  /** Fase que está atrasada (prazo vencido sem conclusão). */
  delayedPhase?: PhaseName
  /** Fator de produtividade fictício usado para gerar horas realizadas. */
  performance: number
}

export interface ProjectPhase {
  name: PhaseName
  start: string
  end: string
  durationDays: number
  status: PhaseStatus
}

/** Registro atômico: projeto × mês × atividade. Toda agregação parte daqui. */
export interface HoursRecord {
  id: string
  projectId: string
  month: string
  product: ProductId
  sector: SectorId
  activityId: string
  stage: string
  phase: PhaseName
  category: HoursCategory
  areaM2: number | null
  source: 'índice' | 'direto'
  plannedHours: number
  actualHours: number | null
}
