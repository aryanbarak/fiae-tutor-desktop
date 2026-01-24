/**
 * Topic Registry - Strict UI↔Core Contract
 * Defines valid topics, modes, and required parameters
 * Ensures all requests sent to core are valid
 */

// Core modes as defined by the Python core (NOT UI modes)
export type CoreMode = "trace" | "trace_exam" | "quiz" | "pseudocode" | "explain" | "debug";

// All supported topic IDs
export type TopicId =
  | "minimum"
  | "selectionsort"
  | "insertionsort"
  | "bubblesort"
  | "binarysearch"
  | "search_contains"
  | "count_condition"
  | "minmax_avg"
  | "maxperiod"
  | "checksum";

export interface TopicRegistryEntry {
  id: TopicId;
  label: string;
  description: string;
  allowedModes: CoreMode[];
  requiredParams: string[];
  defaultParams: Record<string, any>;
}

/**
 * Topic Registry - Single source of truth for all topics
 */
export const TOPIC_REGISTRY: Record<TopicId, TopicRegistryEntry> = {
  minimum: {
    id: "minimum",
    label: "Minimum",
    description: "Find minimum value in array starting from given index",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain"],
    requiredParams: ["arr", "start"],
    defaultParams: { arr: [64, 25, 12, 22, 11], start: 0 },
  },

  selectionsort: {
    id: "selectionsort",
    label: "Selection Sort",
    description: "Sort array using selection sort algorithm",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain", "quiz"],
    requiredParams: ["array"], // Note: selectionsort uses "array" not "arr"
    defaultParams: { array: [64, 25, 12, 22, 11] },
  },

  insertionsort: {
    id: "insertionsort",
    label: "Insertion Sort",
    description: "Sort array using insertion sort algorithm",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain", "quiz"],
    requiredParams: ["arr"],
    defaultParams: { arr: [64, 25, 12, 22, 11] },
  },

  bubblesort: {
    id: "bubblesort",
    label: "Bubble Sort",
    description: "Sort array using bubble sort algorithm",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain", "quiz"],
    requiredParams: ["arr"],
    defaultParams: { arr: [64, 25, 12, 22, 11] },
  },

  binarysearch: {
    id: "binarysearch",
    label: "Binary Search",
    description: "Search for target in sorted array using binary search",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain", "quiz"],
    requiredParams: ["arr", "target"],
    defaultParams: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
  },

  search_contains: {
    id: "search_contains",
    label: "Search Contains",
    description: "Search if array contains target value",
    allowedModes: ["trace", "trace_exam", "explain"],
    requiredParams: ["case", "arr", "target"],
    defaultParams: { case: "contains", variant: "int_asc", arr: [1, 3, 5, 7, 9], target: 7 },
  },

  count_condition: {
    id: "count_condition",
    label: "Count Condition",
    description: "Count elements matching a condition",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain"],
    requiredParams: ["arr", "threshold", "case"],
    defaultParams: { arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" },
  },

  minmax_avg: {
    id: "minmax_avg",
    label: "Min/Max/Average",
    description: "Calculate minimum, maximum, and average of array",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain"],
    requiredParams: ["arr"],
    defaultParams: { arr: [64, 25, 12, 22, 11] },
  },

  maxperiod: {
    id: "maxperiod",
    label: "Max Period",
    description: "Find longest sequence of 1s in binary array",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain"],
    requiredParams: ["arr"],
    defaultParams: { arr: [1, 1, 0, 1, 1, 1, 0] },
  },

  checksum: {
    id: "checksum",
    label: "Checksum",
    description: "Compute or verify checksum",
    allowedModes: ["pseudocode", "trace", "trace_exam", "explain"],
    requiredParams: ["case", "code", "weights"],
    defaultParams: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] },
  },
};

/**
 * Get topic registry entry by ID
 */
export function getTopicEntry(topicId: TopicId): TopicRegistryEntry {
  return TOPIC_REGISTRY[topicId];
}

/**
 * Get all topic IDs
 */
export function getAllTopicIds(): TopicId[] {
  return Object.keys(TOPIC_REGISTRY) as TopicId[];
}

/**
 * Get default parameters for a topic
 */
export function getDefaultParams(topicId: TopicId): Record<string, any> {
  return { ...TOPIC_REGISTRY[topicId].defaultParams };
}

/**
 * Get allowed modes for a topic
 */
export function getAllowedModes(topicId: TopicId): CoreMode[] {
  return TOPIC_REGISTRY[topicId].allowedModes;
}

/**
 * Validate if mode is allowed for topic
 */
export function isModeAllowed(topicId: TopicId, mode: CoreMode): boolean {
  return TOPIC_REGISTRY[topicId].allowedModes.includes(mode);
}

/**
 * Validate parameters for a topic
 * Returns array of error messages (empty if valid)
 */
export function validateTopicParams(topicId: TopicId, params: any): string[] {
  const errors: string[] = [];
  const entry = TOPIC_REGISTRY[topicId];

  if (!params || typeof params !== "object") {
    errors.push("Parameters must be a JSON object");
    return errors;
  }

  // Check required params exist and are non-empty
  for (const reqParam of entry.requiredParams) {
    if (!(reqParam in params)) {
      errors.push(`Missing required parameter: ${reqParam}`);
    } else if (params[reqParam] === null || params[reqParam] === undefined) {
      errors.push(`Required parameter '${reqParam}' cannot be null or undefined`);
    } else if (typeof params[reqParam] === "string" && params[reqParam].trim() === "") {
      errors.push(`Required parameter '${reqParam}' cannot be empty`);
    } else if (Array.isArray(params[reqParam]) && params[reqParam].length === 0) {
      errors.push(`Required parameter '${reqParam}' cannot be an empty array`);
    }
  }

  return errors;
}
