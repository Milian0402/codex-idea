import { hashPlanText } from './hash';
import { isPreviewStale, parsePlanToPreviewSpec } from './planParser';

describe('parsePlanToPreviewSpec', () => {
  it('maps structured plan content into a preview spec', () => {
    const plan = `
Product: Momentum CRM
Screen: Deal Pipeline Console
Tone: clean and professional

- Layout section: hero summary with priority stats
- Layout section: workspace board with timeline and activity feed
- Core component: filter form with region and owner controls
- Core component: deal stage table with risk column
- Data block: conversion metric and stalled deal signals
`.trim();

    const result = parsePlanToPreviewSpec(plan);

    expect(result.productName).toBe('Momentum Crm');
    expect(result.pageTitle).toBe('Deal Pipeline Console');
    expect(result.layoutSections.length).toBeGreaterThan(1);
    expect(result.coreComponents.some((entry) => /form|table/i.test(entry))).toBe(true);
    expect(result.dataBlocks.length).toBeGreaterThan(0);
    expect(result.visualTone).toBe('Clean editorial');
  });

  it('falls back safely for minimal freeform text', () => {
    const result = parsePlanToPreviewSpec('build dashboard with cards and chart plus progress stats');

    expect(result.productName.length).toBeGreaterThan(0);
    expect(result.pageTitle.length).toBeGreaterThan(0);
    expect(result.layoutSections.length).toBeGreaterThan(0);
    expect(result.coreComponents.length).toBeGreaterThan(0);
    expect(result.dataBlocks.length).toBeGreaterThan(0);
  });

  it('returns fallback spec for empty input', () => {
    const result = parsePlanToPreviewSpec('   ');

    expect(result).toEqual({
      productName: 'Plan Preview Product',
      pageTitle: 'Proposed Feature Screen',
      layoutSections: ['Hero Overview', 'Workspace Canvas', 'Action Rail'],
      coreComponents: ['Status Cards', 'Primary Editor', 'Decision Controls'],
      dataBlocks: ['Plan Snapshot', 'Progress Signals', 'Validation Checklist'],
      visualTone: 'Structured futuristic'
    });
  });

  it('is deterministic for identical plan input', () => {
    const plan = `
Product: Velocity Planner
- Show board sections for current tasks, blockers, and done list
- Include action controls and timeline feed
- Include progress data blocks for quality checks
`.trim();

    expect(parsePlanToPreviewSpec(plan)).toEqual(parsePlanToPreviewSpec(plan));
  });
});

describe('isPreviewStale', () => {
  it('reports stale and non-stale cases based on hash', () => {
    const plan = 'Product: Demo\n- build a timeline view';
    const sourcePlanHash = hashPlanText(plan);

    expect(isPreviewStale(plan, sourcePlanHash)).toBe(false);
    expect(isPreviewStale(`${plan}\n- add export`, sourcePlanHash)).toBe(true);
  });
});
