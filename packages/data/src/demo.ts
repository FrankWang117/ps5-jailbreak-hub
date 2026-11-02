import { datasetSchema } from '@ps5/core';
import sample from './sample.json';
/** 仅供显式演示模式使用，不与正式目录合并。 */
export const demoDataset = datasetSchema.parse(sample);
