import { AppModel } from "./model";
import { Msg } from "./actions";
import { Cmd } from "./commands";
import { 
  getDefaultParams, 
  validateTopicParams, 
  isModeAllowed, 
  getAllowedModes 
} from "../domain/topicRegistry";
import { toCoreMode } from "../domain/modeMap";
import { 
  normalizeAndValidateParams, 
  autoPopulateParams,
  formatValidationErrors 
} from "../domain/paramValidator";

/**
 * Update function - pure state transitions (MVU pattern)
 * Returns new model and optional command
 */
export function update(
  model: AppModel,
  msg: Msg
): { model: AppModel; cmd: Cmd } {
  console.log("[MSG]", msg);
  
  switch (msg.type) {
    case "PracticeTopicChanged": {
      // When topic changes, validate current mode is allowed for new topic
      // If not, reset to first allowed mode
      const allowedModes = getAllowedModes(msg.topic);
      const coreMode = toCoreMode(model.practice.mode);
      const modeAllowed = isModeAllowed(msg.topic, coreMode);
      const newMode = modeAllowed ? model.practice.mode : allowedModes[0] as any; // fallback to first allowed
      
      // Auto-populate params with mode defaults, preserving matching user values
      let currentParams: Record<string, any> = {};
      try {
        currentParams = JSON.parse(model.practice.paramsText);
      } catch {
        // If current params invalid, start fresh
      }
      
      const newCoreMode = toCoreMode(newMode);
      const populatedParams = autoPopulateParams(msg.topic, newCoreMode, currentParams);
      const paramsText = JSON.stringify(populatedParams, null, 2);
      
      // Validate the populated params
      const validation = normalizeAndValidateParams(msg.topic, newCoreMode, populatedParams);
      
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            topic: msg.topic,
            mode: newMode,
            paramsText,
            paramsValid: validation.ok,
            paramsErrors: validation.errors,
            // Clear variants when topic changes - they'll reload on next run
            availableVariants: [],
            selectedVariantId: null,
            logs: [
              ...model.practice.logs,
              `[TOPIC] Changed to ${msg.topic}, cleared variants`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeModeChanged": {
      // Validate mode is allowed for current topic
      const coreMode = toCoreMode(msg.mode);
      if (!isModeAllowed(model.practice.topic, coreMode)) {
        console.warn(`Mode ${msg.mode} (core: ${coreMode}) not allowed for topic ${model.practice.topic}`);
        return { model, cmd: { type: "none" } };
      }
      
      // Auto-populate params with new mode defaults, preserving user values
      let currentParams: Record<string, any> = {};
      try {
        currentParams = JSON.parse(model.practice.paramsText);
      } catch {
        // If current params invalid, start fresh
      }
      
      const populatedParams = autoPopulateParams(model.practice.topic, coreMode, currentParams);
      const paramsText = JSON.stringify(populatedParams, null, 2);
      
      // Validate the populated params
      const validation = normalizeAndValidateParams(model.practice.topic, coreMode, populatedParams);
      
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            mode: msg.mode,
            paramsText,
            paramsValid: validation.ok,
            paramsErrors: validation.errors,
            // Clear variants when mode changes - they'll reload on next run
            availableVariants: [],
            selectedVariantId: null,
            logs: [
              ...model.practice.logs,
              `[MODE] Changed to ${msg.mode}, cleared variants`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeLangChanged":
      return {
        model: {
          ...model,
          practice: { ...model.practice, lang: msg.lang },
        },
        cmd: { type: "none" },
      };

    case "PracticeParamsChanged": {
      // Validate JSON syntax
      let parsedParams = null;
      try {
        parsedParams = JSON.parse(msg.paramsText);
      } catch (e) {
        // Invalid JSON - don't validate topic params yet
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              paramsText: msg.paramsText,
              paramsValid: false,
              paramsErrors: [`JSON syntax error: ${e instanceof Error ? e.message : String(e)}`],
              // Preserve variant state
              availableVariants: model.practice.availableVariants,
              selectedVariantId: model.practice.selectedVariantId,
            },
          },
          cmd: { type: "none" },
        };
      }

      // Validate and normalize topic-specific params
      const coreMode = toCoreMode(model.practice.mode);
      const validation = normalizeAndValidateParams(model.practice.topic, coreMode, parsedParams);
      
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            paramsText: msg.paramsText,
            paramsValid: validation.ok,
            paramsErrors: validation.errors,
            // Preserve variant state
            availableVariants: model.practice.availableVariants,
            selectedVariantId: model.practice.selectedVariantId,
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeTabChanged": {
      const result = {
        model: {
          ...model,
          practice: { ...model.practice, viewTab: msg.tab },
        },
        cmd: { type: "none" } as Cmd,
      };
      console.log(
        "[TAB]",
        result.model.practice.viewTab,
        "[STATUS]",
        result.model.practice.status
      );
      return result;
    }

    case "PracticeRunRequested": {
      console.log("[UPDATE] RUN_CLICK");
      
      // Parse params JSON safely
      let params: Record<string, any>;
      try {
        params = JSON.parse(model.practice.paramsText);
      } catch (e) {
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              status: "error",
              error: `Invalid JSON in params: ${e instanceof Error ? e.message : String(e)}`,
              // Preserve variant state
              availableVariants: model.practice.availableVariants,
              selectedVariantId: model.practice.selectedVariantId,
            },
          },
          cmd: { type: "none" },
        };
      }

      // Validate mode is allowed for topic
      const coreMode = toCoreMode(model.practice.mode);
      if (!isModeAllowed(model.practice.topic, coreMode)) {
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              status: "error",
              error: `Mode '${model.practice.mode}' (core: '${coreMode}') is not allowed for topic '${model.practice.topic}'`,
              // Preserve variant state
              availableVariants: model.practice.availableVariants,
              selectedVariantId: model.practice.selectedVariantId,
            },
          },
          cmd: { type: "none" },
        };
      }

      // Normalize and validate params BEFORE calling core
      const validation = normalizeAndValidateParams(model.practice.topic, coreMode, params);
      if (!validation.ok) {
        const errorMsg = formatValidationErrors(validation.errors);
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              status: "error",
              error: `Parameter validation failed:\n${errorMsg}`,
              paramsErrors: validation.errors,
              // Preserve variant state
              availableVariants: model.practice.availableVariants,
              selectedVariantId: model.practice.selectedVariantId,
            },
          },
          cmd: { type: "none" },
        };
      }

      // Use normalized params for the core call
      const normalizedParams = validation.normalizedParams;

      // Build request with core mode (map trace_learn → trace)
      const request = {
        version: "1.0",
        topic: model.practice.topic,
        mode: coreMode, // ✅ Send core mode, not UI mode
        lang: model.practice.lang,
        params: normalizedParams, // ✅ Use normalized params
      };

      console.log("[UPDATE] Request built:", {
        topic: request.topic,
        mode: request.mode,
        lang: request.lang,
        paramKeys: Object.keys(request.params),
      });

      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            status: "running",
            error: undefined,
            response: undefined,
            raw: undefined,
            eventIndex: 0,
            // CRITICAL: Preserve variant state when running
            availableVariants: model.practice.availableVariants,
            selectedVariantId: model.practice.selectedVariantId,
          },
        },
        cmd: {
          type: "RunTutor",
          request,
        },
      };
    }

    case "PracticeRunSucceeded": {
      // Extract variants from response if present (for pseudocode/explain modes)
      const result = msg.response?.result as any;
      const variants = result?.variants as any[] | undefined;
      
      // SAFE: Initialize with existing values, never undefined
      let availableVariants = model.practice?.availableVariants || [];
      let selectedVariantId = model.practice?.selectedVariantId || null;
      
      // If response contains variants, update our variant state
      if (Array.isArray(variants) && variants.length > 0) {
        availableVariants = variants.map(v => ({
          id: v.id || `variant_${variants.indexOf(v)}`,
          title: v.title || v.id || `Variant ${variants.indexOf(v) + 1}`,
          labels: v.labels,
          ...v, // Include all variant data
        }));
        
        // If no variant selected, or selected variant not in new list, select first
        const selectedExists = selectedVariantId 
          ? availableVariants.some(v => v.id === selectedVariantId)
          : false;
        
        if (!selectedVariantId || !selectedExists) {
          selectedVariantId = availableVariants[0]?.id || null;
        }
        
        console.log(`[VARIANTS] Loaded ${availableVariants.length} variants, selected: ${selectedVariantId}`);
      }
      // If no variants in response, clear them (switching to non-variant mode)
      else if (!variants) {
        console.log("[VARIANTS] No variants in response, clearing variant state");
        availableVariants = [];
        selectedVariantId = null;
      }
      
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            status: "success",
            response: msg.response,
            raw: msg.raw,
            eventIndex: 0,
            availableVariants,
            selectedVariantId,
            logs: [
              ...model.practice.logs,
              `[SUCCESS] ${new Date().toLocaleTimeString()}`,
              ...(availableVariants.length > 0 
                ? [`[VARIANTS] ${availableVariants.length} variants available`]
                : []
              ),
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeRunFailed":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            status: "error",
            error: msg.error,
            logs: [
              ...model.practice.logs,
              `[ERROR] ${new Date().toLocaleTimeString()} - ${msg.error}`,
            ],
            // Preserve variant state
            availableVariants: model.practice.availableVariants,
            selectedVariantId: model.practice.selectedVariantId,
          },
        },
        cmd: { type: "none" },
      };

    case "PracticeVariantSelected": {
      // When user selects a different variant, update params with variant defaults
      // and trigger a new run with that variant
      const availableVariants = model.practice?.availableVariants || [];
      const variant = availableVariants.find(v => v.id === msg.variantId);
      
      if (!variant) {
        console.warn(`[VARIANTS] Variant ${msg.variantId} not found in ${availableVariants.length} available variants`);
        return { model, cmd: { type: "none" } };
      }
      
      console.log(`[VARIANTS] Selected: ${model.practice?.selectedVariantId || 'none'} -> ${msg.variantId}`);
      console.log(`[VARIANTS] Available variants count: ${availableVariants.length}`);
      
      // Parse current params
      let currentParams: Record<string, any> = {};
      try {
        currentParams = JSON.parse(model.practice.paramsText);
      } catch {
        // If current params invalid, use defaults
      }
      
      // Update params with variant ID
      const updatedParams = {
        ...currentParams,
        variant: msg.variantId,
      };
      
      const paramsText = JSON.stringify(updatedParams, null, 2);
      
      // Validate params
      const coreMode = toCoreMode(model.practice.mode);
      const validation = normalizeAndValidateParams(model.practice.topic, coreMode, updatedParams);
      
      // Update selected variant and params, then trigger run
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            selectedVariantId: msg.variantId,
            availableVariants: availableVariants, // Preserve variants!
            paramsText,
            paramsValid: validation.ok,
            paramsErrors: validation.errors,
            logs: [
              ...model.practice.logs,
              `[VARIANTS] Switched to variant: ${variant.title}`,
            ],
          },
        },
        // Automatically trigger a run with the new variant
        cmd: { type: "none" }, // User can manually run if needed
      };
    }

    case "PracticeEventFirst":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            eventIndex: 0,
            logs: [
              ...model.practice.logs,
              `[NAV] First event (0)`,
            ],
          },
        },
        cmd: { type: "none" },
      };

    case "PracticeEventPrev": {
      const newIndex = Math.max(0, model.practice.eventIndex - 1);
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            eventIndex: newIndex,
            logs: [
              ...model.practice.logs,
              `[NAV] Previous event (${newIndex})`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeEventNext": {
      const eventCount = model.practice.response?.events?.length || 0;
      const newIndex = Math.min(eventCount - 1, model.practice.eventIndex + 1);
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            eventIndex: newIndex,
            logs: [
              ...model.practice.logs,
              `[NAV] Next event (${newIndex})`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeEventLast": {
      const eventCount = model.practice.response?.events?.length || 0;
      const newIndex = eventCount - 1;
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            eventIndex: newIndex,
            logs: [
              ...model.practice.logs,
              `[NAV] Last event (${newIndex})`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeEventSet":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            eventIndex: msg.index,
            logs: [
              ...model.practice.logs,
              `[NAV] Set event (${msg.index})`,
            ],
          },
        },
        cmd: { type: "none" },
      };

    case "PingSelfTest":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            logs: [...model.practice.logs, "[PING] Self-test initiated"],
          },
        },
        cmd: { type: "Ping" },
      };

    case "PingSucceeded":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            logs: [
              ...model.practice.logs,
              `[PING] Success: ${msg.result}`,
            ],
          },
        },
        cmd: { type: "none" },
      };

    case "PingFailed":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            logs: [
              ...model.practice.logs,
              `[PING] Failed: ${msg.error}`,
            ],
          },
        },
        cmd: { type: "none" },
      };

    case "PracticeEventFilterChanged":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            eventFilter: msg.filter,
          },
        },
        cmd: { type: "none" },
      };

    case "PracticeLoadPreset": {
      const params = getDefaultParams(msg.topic);
      const paramsText = JSON.stringify(params, null, 2);
      const errors = validateTopicParams(msg.topic, params);
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            topic: msg.topic,
            mode: msg.mode,
            paramsText,
            paramsValid: true,
            paramsErrors: errors,
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeAddLog":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            logs: [...model.practice.logs, msg.log],
          },
        },
        cmd: { type: "none" },
      };

    case "PracticeRequestPreviewToggle":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            requestPreviewOpen: !model.practice.requestPreviewOpen,
          },
        },
        cmd: { type: "none" },
      };

    case "PracticeCopyRequest": {
      try {
        const params = JSON.parse(model.practice.paramsText);
        const request = {
          version: "1.0",
          topic: model.practice.topic,
          mode: model.practice.mode,
          lang: model.practice.lang,
          params,
        };
        navigator.clipboard.writeText(JSON.stringify(request, null, 2));
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              logs: [...model.practice.logs, "[COPY] Request copied to clipboard"],
            },
          },
          cmd: { type: "none" },
        };
      } catch (e) {
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              logs: [...model.practice.logs, `[COPY] Failed to copy request: ${e}`],
            },
          },
          cmd: { type: "none" },
        };
      }
    }

    case "PracticeCopyResult": {
      if (model.practice.raw) {
        navigator.clipboard.writeText(model.practice.raw);
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              logs: [...model.practice.logs, "[COPY] Result copied to clipboard"],
            },
          },
          cmd: { type: "none" },
        };
      }
      return { model, cmd: { type: "none" } };
    }

    case "PracticeSelfTest":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            logs: [...model.practice.logs, "[SELF-TEST] Starting self-test..."],
          },
        },
        cmd: { type: "SelfTest" },
      };

    case "PracticeParamsEditorToggle": {
      const newState = !model.practice.paramsEditorOpen;
      localStorage.setItem("fiae-paramsEditorOpen", String(newState));
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            paramsEditorOpen: newState,
            logs: [
              ...model.practice.logs,
              `[UI] Params editor ${newState ? "expanded" : "collapsed"}`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    case "PracticeFullscreenToggle": {
      const newState = !model.practice.isFullscreen;
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            isFullscreen: newState,
            logs: [
              ...model.practice.logs,
              `[UI] Fullscreen ${newState ? "enabled" : "disabled"}`,
            ],
          },
        },
        cmd: { type: "none" },
      };
    }

    default:
      console.warn("[UPDATE] Unknown message:", msg);
      return { model, cmd: { type: "none" } };
  }
}
