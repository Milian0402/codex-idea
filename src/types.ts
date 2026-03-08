export type PlanStatus =
  | 'drafting'
  | 'plan_complete'
  | 'preview_ready'
  | 'approved_simulation';

export interface PlanSession {
  id: string;
  userGoal: string;
  planText: string;
  status: PlanStatus;
  updatedAt: string;
}

export interface PreviewSpec {
  productName: string;
  pageTitle: string;
  layoutSections: string[];
  coreComponents: string[];
  dataBlocks: string[];
  visualTone: string;
}

export interface GeneratedPreview {
  spec: PreviewSpec;
  generatedAt: string;
  sourcePlanHash: string;
}

export type SimulationState = 'pending' | 'active' | 'complete';

export interface BuildSimulationEvent {
  stepId: string;
  label: string;
  state: SimulationState;
  timestamp: string;
}
