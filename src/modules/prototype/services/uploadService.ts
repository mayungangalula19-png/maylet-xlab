import { uploadPrototypeBuild } from './prototypeService';
import type { PrototypeFile } from '../types/prototype.types';

export const uploadService = {
  uploadBuild: uploadPrototypeBuild,
};

export type { PrototypeFile };
