import { getViewportMode } from './layout';

describe('getViewportMode', () => {
  it('returns desktop for large widths', () => {
    expect(getViewportMode(1200)).toBe('desktop');
  });

  it('returns mobile at and below breakpoint', () => {
    expect(getViewportMode(980)).toBe('mobile');
    expect(getViewportMode(760)).toBe('mobile');
  });
});
