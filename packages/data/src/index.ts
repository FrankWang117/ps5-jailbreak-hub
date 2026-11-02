import { datasetSchema } from '@ps5/core';
import sample from './sample.json';
/** 所有条目仅用于 M0 演示，不是兼容性数据库。 */
export const dataset = datasetSchema.parse(sample);
