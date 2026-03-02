/**
 * Parameter Validation - Normalize and validate params before core invocation
 */

import { TopicId, CoreMode, TOPIC_REGISTRY } from "./topicRegistry";
import { getModeDefaults, normalizeParamKeys, PARAM_SCHEMAS } from "./paramSchema";

export interface ValidationResult {
  ok: boolean;
  normalizedParams: Record<string, any>;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive param validation with normalization
 * 
 * Process:
 * 1. Normalize keys (arr vs array)
 * 2. Merge with mode-specific defaults (preserve user values)
 * 3. Validate required params exist and non-empty
 * 4. Type-check values
 * 
 * @param topicId - Current topic
 * @param mode - Current mode
 * @param userParams - User-provided params (may be partial or have wrong keys)
 * @returns Validation result with normalized params or errors
 */
export function normalizeAndValidateParams(
  topicId: TopicId,
  mode: CoreMode,
  userParams: Record<string, any>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Normalize keys (arr vs array, etc.)
  const normalized = normalizeParamKeys(topicId, userParams);

  // Step 2: Get mode-specific defaults
  const modeDefaults = getModeDefaults(topicId, mode);

  // Step 3: Merge with defaults (user values take precedence)
  const mergedParams = { ...modeDefaults, ...normalized };

  // Step 4: Get required params from registry
  const topicEntry = TOPIC_REGISTRY[topicId];
  if (!topicEntry) {
    errors.push(`Unknown topic: ${topicId}`);
    return { ok: false, normalizedParams: mergedParams, errors, warnings };
  }

  const requiredParams = topicEntry.requiredParams || [];

  // Step 5: Validate required params exist
  if (mode !== "exam_session") {
    for (const param of requiredParams) {
      if (!(param in mergedParams)) {
        errors.push(`Missing required parameter: ${param}`);
      } else {
        const value = mergedParams[param];
        
        // Check for empty/null values
        if (value === null || value === undefined || value === "") {
          errors.push(`Parameter '${param}' cannot be empty`);
        }
        
        // Array-specific validation
        if (Array.isArray(value)) {
          if (value.length === 0) {
            errors.push(`Parameter '${param}' array cannot be empty`);
          }
        }
      }
    }
  }

  // Step 6: Type validation based on schema
  if (mode !== "exam_session") {
    const schema = PARAM_SCHEMAS[topicId];
    if (schema) {
      for (const paramDef of schema.params) {
        const key = paramDef.key;
        if (key in mergedParams) {
          const value = mergedParams[key];
          
          // Type-specific validation
          switch (paramDef.type) {
            case "array":
              if (!Array.isArray(value)) {
                errors.push(`Parameter '${key}' must be an array, got: ${typeof value}`);
              }
              break;
            
            case "number":
              if (typeof value !== "number" || isNaN(value)) {
                errors.push(`Parameter '${key}' must be a number, got: ${typeof value}`);
              }
              break;
            
            case "string":
              if (typeof value !== "string") {
                errors.push(`Parameter '${key}' must be a string, got: ${typeof value}`);
              }
              break;
          }
        }
      }
    }
  }

  // Step 6b: Topic-specific semantic validation
  if (mode !== "exam_session" && topicId === "binarysearch") {
    const arr = mergedParams["arr"];
    if (Array.isArray(arr) && arr.length > 1) {
      const isNonDecreasing = arr.every(
        (v, i) => i === 0 || arr[i - 1] <= v
      );
      const isNonIncreasing = arr.every(
        (v, i) => i === 0 || arr[i - 1] >= v
      );

      if (!isNonDecreasing && !isNonIncreasing) {
        errors.push(
          "Parameter 'arr' must be sorted for binary search (ascending or descending)"
        );
      }
    }
  }

  // Step 7: Check if mode is allowed for this topic
  const allowedModes = topicEntry.allowedModes || [];
  if (!allowedModes.includes(mode)) {
    warnings.push(`Mode '${mode}' may not be supported for topic '${topicId}'`);
  }

  return {
    ok: errors.length === 0,
    normalizedParams: mergedParams,
    errors,
    warnings,
  };
}

/**
 * Auto-populate params when topic or mode changes
 * Merges mode defaults with existing user params (preserves user data where keys match)
 * 
 * @param topicId - New topic
 * @param mode - New mode
 * @param currentParams - Current user params (may be from previous topic)
 * @returns Merged params with defaults filled in
 */
export function autoPopulateParams(
  topicId: TopicId,
  mode: CoreMode,
  currentParams: Record<string, any>
): Record<string, any> {
  // Get fresh mode defaults
  const modeDefaults = getModeDefaults(topicId, mode);
  
  // Normalize current params in case they have old aliases
  const normalized = normalizeParamKeys(topicId, currentParams);
  
  // Merge: defaults first, then overlay user values
  // This preserves user edits for matching keys
  return { ...modeDefaults, ...normalized };
}

/**
 * Get user-friendly error message for validation errors
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return "";
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  return `${errors.length} validation errors:\n` + errors.map(e => `- ${e}`).join("\n");
}
