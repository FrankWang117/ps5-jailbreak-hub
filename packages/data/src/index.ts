import { publishedDatasetSchema } from '@ps5/core';
import published from './published.json';
/** 默认导出只包含正式资料；不隐式回退到示例。 */
export const dataset = publishedDatasetSchema.parse(published);

export { knowledgeBase } from './knowledge';
