/**
 * Topic specification system with parameter validation
 * Ensures UI always sends valid params for each topic
 */

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

export type ModeId = "explain" | "pseudocode" | "trace_learn" | "trace_exam" | "quiz" | "debug";

export interface ParamSpec {
  name: string;
  type: "number" | "number[]" | "string" | "boolean";
  required: boolean;
  description: string;
  example?: any;
}

export interface TopicSpec {
  id: TopicId;
  name: string;
  description: string;
  params: ParamSpec[];
  exampleParams: Record<string, any>;
}

const TOPIC_SPECS: Record<TopicId, TopicSpec> = {
  minimum: {
    id: "minimum",
    name: "Minimum",
    description: "Find minimum value in array starting from given index",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Input array", example: [64, 25, 12, 22, 11] },
      { name: "start", type: "number", required: true, description: "Start index", example: 0 },
    ],
    exampleParams: { arr: [64, 25, 12, 22, 11], start: 0 },
  },

  selectionsort: {
    id: "selectionsort",
    name: "Selection Sort",
    description: "Sort array using selection sort algorithm",
    params: [
      { name: "array", type: "number[]", required: true, description: "Array to sort", example: [64, 25, 12, 22, 11] },
    ],
    exampleParams: { array: [64, 25, 12, 22, 11] },
  },

  insertionsort: {
    id: "insertionsort",
    name: "Insertion Sort",
    description: "Sort array using insertion sort algorithm",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Array to sort", example: [64, 25, 12, 22, 11] },
    ],
    exampleParams: { arr: [64, 25, 12, 22, 11] },
  },

  bubblesort: {
    id: "bubblesort",
    name: "Bubble Sort",
    description: "Sort array using bubble sort algorithm",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Array to sort", example: [64, 25, 12, 22, 11] },
    ],
    exampleParams: { arr: [64, 25, 12, 22, 11] },
  },

  binarysearch: {
    id: "binarysearch",
    name: "Binary Search",
    description: "Search for target in sorted array using binary search",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Sorted array", example: [1, 3, 5, 7, 9, 11] },
      { name: "target", type: "number", required: true, description: "Value to search for", example: 7 },
    ],
    exampleParams: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
  },

  search_contains: {
    id: "search_contains",
    name: "Search Contains",
    description: "Search if array contains target value",
    params: [
      { name: "case", type: "string", required: true, description: "Search case", example: "contains" },
      { name: "variant", type: "string", required: false, description: "Array variant", example: "int_asc" },
      { name: "arr", type: "number[]", required: true, description: "Array to search", example: [1, 3, 5, 7, 9] },
      { name: "target", type: "number", required: true, description: "Value to search for", example: 7 },
    ],
    exampleParams: { case: "contains", variant: "int_asc", arr: [1, 3, 5, 7, 9], target: 7 },
  },

  count_condition: {
    id: "count_condition",
    name: "Count Condition",
    description: "Count elements matching a condition",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Input array", example: [1, 5, 7, 2, 9] },
      { name: "threshold", type: "number", required: true, description: "Threshold value", example: 4 },
      { name: "case", type: "string", required: true, description: "Condition case", example: "count_gt" },
    ],
    exampleParams: { arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" },
  },

  minmax_avg: {
    id: "minmax_avg",
    name: "Min/Max/Average",
    description: "Calculate minimum, maximum, and average of array",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Input array", example: [64, 25, 12, 22, 11] },
    ],
    exampleParams: { arr: [64, 25, 12, 22, 11] },
  },

  maxperiod: {
    id: "maxperiod",
    name: "Max Period",
    description: "Find longest sequence of 1s in binary array",
    params: [
      { name: "arr", type: "number[]", required: true, description: "Binary array (0s and 1s)", example: [1, 1, 0, 1, 1, 1, 0] },
    ],
    exampleParams: { arr: [1, 1, 0, 1, 1, 1, 0] },
  },

  checksum: {
    id: "checksum",
    name: "Checksum",
    description: "Compute or verify checksum",
    params: [
      { name: "case", type: "string", required: true, description: "Operation: compute or verify", example: "compute" },
      { name: "code", type: "string", required: false, description: "Code string", example: "12345" },
      { name: "weights", type: "number[]", required: false, description: "Weight array", example: [2, 1, 2, 1] },
      { name: "digits", type: "number[]", required: false, description: "Digit array", example: [1, 2, 3, 4, 5] },
    ],
    exampleParams: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] },
  },
};

/**
 * Get default parameters for a topic and mode
 */
export function getDefaultParams(topic: TopicId, _mode: ModeId): Record<string, any> {
  const spec = TOPIC_SPECS[topic];
  return spec ? { ...spec.exampleParams } : {};
}

/**
 * Validate parameters for a topic
 * Returns array of error messages (empty if valid)
 */
export function validateParams(topic: TopicId, params: any): string[] {
  const errors: string[] = [];
  const spec = TOPIC_SPECS[topic];

  if (!spec) {
    errors.push(`Unknown topic: ${topic}`);
    return errors;
  }

  if (!params || typeof params !== "object") {
    errors.push("Parameters must be a JSON object");
    return errors;
  }

  // Check required params
  for (const paramSpec of spec.params) {
    if (paramSpec.required && !(paramSpec.name in params)) {
      errors.push(`Missing required parameter: ${paramSpec.name} (${paramSpec.description})`);
    }
  }

  // Type validation
  for (const paramSpec of spec.params) {
    const value = params[paramSpec.name];
    if (value === undefined || value === null) continue;

    switch (paramSpec.type) {
      case "number":
        if (typeof value !== "number") {
          errors.push(`Parameter '${paramSpec.name}' must be a number, got ${typeof value}`);
        }
        break;
      case "number[]":
        if (!Array.isArray(value)) {
          errors.push(`Parameter '${paramSpec.name}' must be an array`);
        } else if (value.some((v) => typeof v !== "number")) {
          errors.push(`Parameter '${paramSpec.name}' must be an array of numbers`);
        }
        break;
      case "string":
        if (typeof value !== "string") {
          errors.push(`Parameter '${paramSpec.name}' must be a string, got ${typeof value}`);
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          errors.push(`Parameter '${paramSpec.name}' must be a boolean, got ${typeof value}`);
        }
        break;
    }
  }

  return errors;
}

/**
 * Get topic spec by ID
 */
export function getTopicSpec(topic: TopicId): TopicSpec | undefined {
  return TOPIC_SPECS[topic];
}

/**
 * Get all topic IDs
 */
export function getAllTopicIds(): TopicId[] {
  return Object.keys(TOPIC_SPECS) as TopicId[];
}

/**
 * Get all topic specs
 */
export function getAllTopicSpecs(): TopicSpec[] {
  return Object.values(TOPIC_SPECS);
}
