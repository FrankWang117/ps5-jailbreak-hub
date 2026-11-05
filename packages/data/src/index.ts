import { publishedDatasetSchema, preparationContentSchema } from '@ps5/core';
import preparation from './preparation.json';
export const preparationContent = preparationContentSchema.parse(preparation);
import published from './published.json';
/** 默认导出只包含正式资料；不隐式回退到示例。 */
export const dataset = publishedDatasetSchema.parse(published);

export { knowledgeBase } from './knowledge';

import { siteContentSchema } from '@ps5/core';
import site from './site.json';
export const siteContent = siteContentSchema.parse(site);
