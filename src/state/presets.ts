/**
 * Presets - Default parameters for topic/mode combinations
 */

type PresetKey = `${string}:${string}`; // "topic:mode"

const PRESETS: Record<PresetKey, Record<string, any>> = {
  // BubbleSort
  "bubblesort:pseudocode": { arr: [64, 25, 12, 22, 11] },
  "bubblesort:trace_exam": { arr: [64, 25, 12, 22, 11] },
  "bubblesort:explain": { arr: [64, 25, 12, 22, 11] },
  "bubblesort:quiz": { arr: [64, 25, 12, 22, 11] },
  
  // Binary Search
  "binarysearch:pseudocode": { arr: [1, 3, 5, 7, 9, 11, 13], target: 7 },
  "binarysearch:trace_exam": { arr: [1, 3, 5, 7, 9, 11, 13], target: 7 },
  "binarysearch:explain": { arr: [1, 3, 5, 7, 9, 11, 13], target: 7 },
  "binarysearch:quiz": { arr: [1, 3, 5, 7, 9, 11, 13], target: 7 },
  
  // InsertionSort
  "insertionsort:pseudocode": { arr: [12, 11, 13, 5, 6] },
  "insertionsort:trace_exam": { arr: [12, 11, 13, 5, 6] },
  "insertionsort:explain": { arr: [12, 11, 13, 5, 6] },
  "insertionsort:quiz": { arr: [12, 11, 13, 5, 6] },
  
  // Checksum
  "checksum:pseudocode": { data: [0x12, 0x34, 0x56, 0x78] },
  "checksum:trace_exam": { data: [0x12, 0x34, 0x56, 0x78] },
  "checksum:explain": { data: [0x12, 0x34, 0x56, 0x78] },
  "checksum:quiz": { data: [0x12, 0x34, 0x56, 0x78] },
};

export function getPreset(topic: string, mode: string): Record<string, any> {
  const key: PresetKey = `${topic}:${mode}`;
  return PRESETS[key] || { arr: [1, 2, 3, 4, 5] };
}
