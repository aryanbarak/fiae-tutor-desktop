/**
 * Parameter Schema - Detailed param definitions with validation and normalization
 */

import { TopicId, CoreMode } from "./topicRegistry";

export interface ParamDefinition {
  key: string;
  labelDe: string;
  labelFa: string;
  type: "array" | "number" | "string";
  aliases?: string[]; // Alternative names (e.g., "array" as alias for "arr")
}

export interface ModeDefaults {
  [mode: string]: Record<string, any>;
}

/**
 * Comprehensive parameter schemas for each topic
 */
export const PARAM_SCHEMAS: Record<TopicId, {
  params: ParamDefinition[];
  modeDefaults: ModeDefaults;
}> = {
  minimum: {
    params: [
      { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array" },
      { key: "start", labelDe: "Startindex", labelFa: "شاخص شروع", type: "number" },
    ],
    modeDefaults: {
      trace: { arr: [64, 25, 12, 22, 11], start: 0 },
      trace_exam: { arr: [64, 25, 12, 22, 11], start: 0 },
      pseudocode: { arr: [64, 25, 12, 22, 11], start: 0 },
      explain: { arr: [64, 25, 12, 22, 11], start: 0 },
    },
  },

  selectionsort: {
    params: [
      { key: "array", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["arr"] },
    ],
    modeDefaults: {
      trace: { array: [64, 25, 12, 22, 11] },
      trace_exam: { array: [64, 25, 12, 22, 11] },
      pseudocode: { array: [64, 25, 12, 22, 11] },
      explain: { array: [64, 25, 12, 22, 11] },
      quiz: { array: [64, 25, 12, 22, 11] },
    },
  },

  insertionsort: {
    params: [
      { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
    ],
    modeDefaults: {
      trace: { arr: [64, 25, 12, 22, 11] },
      trace_exam: { arr: [64, 25, 12, 22, 11] },
      pseudocode: { arr: [64, 25, 12, 22, 11] },
      explain: { arr: [64, 25, 12, 22, 11] },
      quiz: { arr: [64, 25, 12, 22, 11] },
    },
  },

  bubblesort: {
    params: [
      { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
    ],
    modeDefaults: {
      trace: { arr: [64, 25, 12, 22, 11] },
      trace_exam: { arr: [64, 25, 12, 22, 11] },
      pseudocode: { arr: [64, 25, 12, 22, 11] },
      explain: { arr: [64, 25, 12, 22, 11] },
      quiz: { arr: [64, 25, 12, 22, 11] },
    },
  },

  binarysearch: {
    params: [
      { key: "arr", labelDe: "Array (sortiert)", labelFa: "آرایه (مرتب شده)", type: "array", aliases: ["array"] },
      { key: "target", labelDe: "Zielwert", labelFa: "هدف", type: "number" },
    ],
    modeDefaults: {
      trace: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
      trace_exam: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
      pseudocode: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
      explain: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
      quiz: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
    },
  },

  search_contains: {
    params: [
      { key: "case", labelDe: "Fall", labelFa: "نوع", type: "string" },
      { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
      { key: "target", labelDe: "Zielwert", labelFa: "هدف", type: "number" },
    ],
    modeDefaults: {
      trace: { case: "contains", variant: "int_asc", arr: [1, 3, 5, 7, 9], target: 7 },
      trace_exam: { case: "contains", variant: "int_asc", arr: [1, 3, 5, 7, 9], target: 7 },
      explain: { case: "contains", variant: "int_asc", arr: [1, 3, 5, 7, 9], target: 7 },
    },
  },

  count_condition: {
    params: [
      { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
      { key: "threshold", labelDe: "Schwellenwert", labelFa: "آستانه", type: "number" },
      { key: "case", labelDe: "Bedingung", labelFa: "شرط", type: "string" },
    ],
    modeDefaults: {
      trace: { arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" },
      trace_exam: { arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" },
      pseudocode: { arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" },
      explain: { arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" },
    },
  },

  minmax_avg: {
    params: [
      { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
    ],
    modeDefaults: {
      trace: { arr: [64, 25, 12, 22, 11] },
      trace_exam: { arr: [64, 25, 12, 22, 11] },
      pseudocode: { arr: [64, 25, 12, 22, 11] },
      explain: { arr: [64, 25, 12, 22, 11] },
    },
  },

  maxperiod: {
    params: [
      { key: "arr", labelDe: "Array (binär)", labelFa: "آرایه (دودویی)", type: "array", aliases: ["array"] },
    ],
    modeDefaults: {
      trace: { arr: [1, 1, 0, 1, 1, 1, 0] },
      trace_exam: { arr: [1, 1, 0, 1, 1, 1, 0] },
      pseudocode: { arr: [1, 1, 0, 1, 1, 1, 0] },
      explain: { arr: [1, 1, 0, 1, 1, 1, 0] },
    },
  },

  checksum: {
    params: [
      { key: "case", labelDe: "Modus", labelFa: "حالت", type: "string" },
      { key: "code", labelDe: "Code", labelFa: "کد", type: "string" },
      { key: "weights", labelDe: "Gewichte", labelFa: "وزن‌ها", type: "array" },
    ],
    modeDefaults: {
      trace: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] },
      trace_exam: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] },
      pseudocode: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] },
      explain: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] },
    },
  },
};

/**
 * Get mode-specific defaults for a topic
 */
export function getModeDefaults(topicId: TopicId, mode: CoreMode): Record<string, any> {
  const schema = PARAM_SCHEMAS[topicId];
  if (!schema) return {};
  
  const defaults = schema.modeDefaults[mode];
  return defaults ? { ...defaults } : {};
}

/**
 * Get parameter label in specified language
 */
export function getParamLabel(topicId: TopicId, paramKey: string, lang: "de" | "fa"): string {
  const schema = PARAM_SCHEMAS[topicId];
  if (!schema) return paramKey;
  
  const param = schema.params.find(p => p.key === paramKey || p.aliases?.includes(paramKey));
  if (!param) return paramKey;
  
  return lang === "fa" ? param.labelFa : param.labelDe;
}

/**
 * Normalize parameter keys (handle aliases like arr vs array)
 * Returns normalized params object with canonical keys
 */
export function normalizeParamKeys(topicId: TopicId, params: Record<string, any>): Record<string, any> {
  const schema = PARAM_SCHEMAS[topicId];
  if (!schema) return params;
  
  const normalized: Record<string, any> = {};
  
  // For each defined param, check if it exists (or its alias exists)
  for (const paramDef of schema.params) {
    const canonicalKey = paramDef.key;
    
    // Check if canonical key exists
    if (canonicalKey in params) {
      normalized[canonicalKey] = params[canonicalKey];
    } 
    // Check aliases
    else if (paramDef.aliases) {
      for (const alias of paramDef.aliases) {
        if (alias in params) {
          normalized[canonicalKey] = params[alias];
          break;
        }
      }
    }
  }
  
  // Preserve any extra keys not in schema (for forward compatibility)
  for (const [key, value] of Object.entries(params)) {
    const isDefined = schema.params.some(p => p.key === key || p.aliases?.includes(key));
    if (!isDefined) {
      normalized[key] = value;
    }
  }
  
  return normalized;
}
