export const calculateScore = (progress: number): number => { return Math.min(100, Math.max(0, progress)); };
