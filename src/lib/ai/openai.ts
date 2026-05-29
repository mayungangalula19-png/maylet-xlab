export const analyzeIdea = async (idea: string): Promise<any> => { return { score: Math.floor(Math.random() * 100), feedback: `Analysis complete for "${idea}".` }; };
