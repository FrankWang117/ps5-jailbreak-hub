import { knowledgeBaseSchema } from '@ps5/core';
import knowledge from './knowledge.json';

/** 知识文章独立于兼容性目录，不能作为兼容性记录参与查询。 */
export const knowledgeBase = knowledgeBaseSchema.parse(knowledge);
