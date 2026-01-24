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
      
      const newParams = getDefaultParams(msg.topic);
      const paramsText = JSON.stringify(newParams, null, 2);
      const errors = validateTopicParams(msg.topic, newParams);
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            topic: msg.topic,
            mode: newMode,
            paramsText,
            paramsValid: true,
            paramsErrors: errors,
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
      
      const newParams = getDefaultParams(model.practice.topic);
      const paramsText = JSON.stringify(newParams, null, 2);
      const errors = validateTopicParams(model.practice.topic, newParams);
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            mode: msg.mode,
            paramsText,
            paramsValid: true,
            paramsErrors: errors,
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
      let paramsValid = false;
      let parsedParams = null;
      try {
        parsedParams = JSON.parse(msg.paramsText);
        paramsValid = true;
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
            },
          },
          cmd: { type: "none" },
        };
      }

      // Validate topic-specific params
      const errors = validateTopicParams(model.practice.topic, parsedParams);
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            paramsText: msg.paramsText,
            paramsValid,
            paramsErrors: errors,
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
            },
          },
          cmd: { type: "none" },
        };
      }

      // Normalize common param name mistakes
      const normalizedParams = { ...params };
      if ("array" in normalizedParams && !("arr" in normalizedParams)) {
        normalizedParams.arr = normalizedParams.array;
        delete normalizedParams.array;
        console.log("[UPDATE] Normalized 'array' → 'arr'");
      }
      if ("num_questions" in normalizedParams && !("numq" in normalizedParams)) {
        normalizedParams.numq = normalizedParams.num_questions;
        delete normalizedParams.num_questions;
        console.log("[UPDATE] Normalized 'num_questions' → 'numq'");
      }
      params = normalizedParams;

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
            },
          },
          cmd: { type: "none" },
        };
      }

      // Validate params before run
      const errors = validateTopicParams(model.practice.topic, params);
      if (errors.length > 0) {
        return {
          model: {
            ...model,
            practice: {
              ...model.practice,
              status: "error",
              error: `❌ Cannot run: Missing required parameters\n\n${errors.join("\n")}`,
              paramsErrors: errors,
            },
          },
          cmd: { type: "none" },
        };
      }

      // Build request with core mode (map trace_learn → trace)
      const request = {
        version: "1.0",
        topic: model.practice.topic,
        mode: coreMode, // ✅ Send core mode, not UI mode
        lang: model.practice.lang,
        params,
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
          },
        },
        cmd: {
          type: "RunTutor",
          request,
        },
      };
    }

    case "PracticeRunSucceeded":
      return {
        model: {
          ...model,
          practice: {
            ...model.practice,
            status: "success",
            response: msg.response,
            raw: msg.raw,
            eventIndex: 0,
            logs: [
              ...model.practice.logs,
              `[SUCCESS] ${new Date().toLocaleTimeString()}`,
            ],
          },
        },
        cmd: { type: "none" },
      };

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
          },
        },
        cmd: { type: "none" },
      };

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

    default:
      console.warn("[UPDATE] Unknown message:", msg);
      return { model, cmd: { type: "none" } };
  }
}
