import { buildApprovalArtifact } from './artifact';
import type { BuildSimulationEvent, GeneratedPreview, PlanSession } from '../types';

describe('buildApprovalArtifact', () => {
  it('creates a frozen artifact with summary and identifiers', () => {
    const session: PlanSession = {
      id: 'session-1',
      userGoal: 'Test artifact',
      planText: 'Product: Demo\nScreen: Workspace\nTone: clean and simple',
      status: 'approved_simulation',
      updatedAt: '2026-03-08T12:00:00.000Z'
    };

    const generatedPreview: GeneratedPreview = {
      generatedAt: '2026-03-08T12:01:00.000Z',
      sourcePlanHash: 'abc12345',
      spec: {
        productName: 'Demo',
        pageTitle: 'Workspace',
        layoutSections: ['Hero'],
        coreComponents: ['Card'],
        dataBlocks: ['Signals'],
        visualTone: 'Clean editorial'
      }
    };

    const simulationEvents: BuildSimulationEvent[] = [
      {
        stepId: 'ready',
        label: 'Ready to execute for real',
        state: 'complete',
        timestamp: '2026-03-08T12:02:00.000Z'
      }
    ];

    const artifact = buildApprovalArtifact(session, generatedPreview, simulationEvents);

    expect(artifact.artifactId).toContain('artifact-abc12345-');
    expect(artifact.sourcePlanHash).toBe('abc12345');
    expect(artifact.generatedPreview).toEqual(generatedPreview);
    expect(artifact.simulationEvents).toEqual(simulationEvents);
    expect(artifact.summary).toContain('Approved Demo / Workspace');
  });
});
