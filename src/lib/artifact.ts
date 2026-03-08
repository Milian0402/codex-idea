import { hashPlanText } from './hash';
import type { ApprovalArtifact, BuildSimulationEvent, GeneratedPreview, PlanSession } from '../types';

const compactTimestamp = (iso: string): string => iso.replace(/[-:TZ.]/g, '').slice(0, 14);

export const buildApprovalArtifact = (
  session: PlanSession,
  generatedPreview: GeneratedPreview,
  simulationEvents: BuildSimulationEvent[]
): ApprovalArtifact => {
  const approvedAt = new Date().toISOString();
  const sourcePlanHash = generatedPreview.sourcePlanHash || hashPlanText(session.planText);

  return {
    artifactId: `artifact-${sourcePlanHash}-${compactTimestamp(approvedAt)}`,
    sourcePlanHash,
    generatedPreview,
    approvedAt,
    simulationEvents,
    summary: `Approved ${generatedPreview.spec.productName} / ${generatedPreview.spec.pageTitle} with ${generatedPreview.spec.coreComponents.length} mapped components.`
  };
};
