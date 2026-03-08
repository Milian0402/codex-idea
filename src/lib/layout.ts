export type ViewportMode = 'desktop' | 'mobile';

export const getViewportMode = (width: number): ViewportMode => (width <= 980 ? 'mobile' : 'desktop');
