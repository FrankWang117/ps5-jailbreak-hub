import { factoryDatasetSchema } from '@ps5/core';
import data from './factory.json';
/** 社区出厂参考不能作为 publishedDataset 的兼容性证据。 */
export const factoryDataset = factoryDatasetSchema.parse(data);
