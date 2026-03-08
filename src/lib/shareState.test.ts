import { deserializeShareState, serializeShareState } from './shareState';
import type { ShareState } from '../types';

describe('share state serialization', () => {
  const sampleState: ShareState = {
    scenarioId: 'simple-ui',
    session: {
      id: 'scenario-simple-ui',
      userGoal: 'Preview before coding',
      planText: 'Product: Demo\n- Build section\n- Add cards',
      status: 'preview_ready',
      updatedAt: '2026-03-08T12:00:00.000Z'
    },
    generatedPreview: {
      generatedAt: '2026-03-08T12:01:00.000Z',
      sourcePlanHash: 'abc12345',
      spec: {
        productName: 'Demo Product',
        pageTitle: 'Demo Workspace',
        layoutSections: ['Hero'],
        coreComponents: ['Cards'],
        dataBlocks: ['Signals'],
        visualTone: 'Clean editorial'
      }
    },
    previewInvalidated: false
  };

  it('round-trips state through url-safe encoding', () => {
    const encoded = serializeShareState(sampleState);
    const decoded = deserializeShareState(encoded);

    expect(decoded).toEqual(sampleState);
  });

  it('returns null for invalid payloads', () => {
    expect(deserializeShareState('not-valid-token')).toBeNull();
  });
});
