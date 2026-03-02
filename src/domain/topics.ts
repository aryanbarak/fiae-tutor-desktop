/**
 * Topic definitions and parameter schemas
 */

export const TOPICS = [
  "bubblesort",
  "insertionsort",
  "selectionsort",
  "binarysearch",
  "search_contains",
  "count_condition",
  "minmax_avg",
  "maxperiod",
  "checksum",
  "minimum",
] as const;

export const MODES = [
  "explain",
  "pseudocode",
  "trace_learn",
  "trace_exam",
  "quiz",
  "debug",
] as const;

export const LANGUAGES = ["de", "fa", "bi"] as const;

/**
 * Returns sensible default parameters for a given topic
 */
export function defaultParams(topic: string): Record<string, any> {
  switch (topic) {
    case "bubblesort":
    case "insertionsort":
    case "selectionsort":
      return { arr: [64, 25, 12, 22, 11] };

    case "binarysearch":
      return { arr: [1, 3, 5, 7, 9, 11], target: 7 };

    case "search_contains":
      return { arr: [64, 25, 12, 22, 11], target: 22 };

    case "count_condition":
      return { arr: [1, 5, 7, 2], threshold: 4, case: "count_gt" };

    case "maxperiod":
      return { arr: [1, 1, 0, 1, 1, 1, 0] };

    case "minmax_avg":
      return { arr: [64, 25, 12, 22, 11] };

    case "checksum":
      return { code: "12345", weights: [2, 1, 2, 1], case: "compute" };

    case "minimum":
      return { arr: [64, 25, 12, 22, 11], start: 2 };

    default:
      return { arr: [64, 25, 12, 22, 11] };
  }
}
