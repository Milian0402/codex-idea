import { DEMO_SCENARIOS } from '../demoScenarios';
import { parsePlanToPreviewSpec } from './planParser';

describe('scenario deterministic previews', () => {
  it('keeps parser output deterministic for all guided scenarios', () => {
    for (const scenario of DEMO_SCENARIOS) {
      expect(parsePlanToPreviewSpec(scenario.planText)).toEqual(parsePlanToPreviewSpec(scenario.planText));
    }
  });

  it('matches expected tone for guided scenarios', () => {
    for (const scenario of DEMO_SCENARIOS) {
      const spec = parsePlanToPreviewSpec(scenario.planText);
      expect(spec.visualTone).toBe(scenario.expectedTone);
    }
  });
});
