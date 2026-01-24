import { Cmd } from "../state/commands";
import { Msg } from "../state/actions";
import { runTutorRaw, ping } from "../api/coreClient";

// Helper to create log messages with timestamps
function logMsg(msg: string): string {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 12);
  return `[${timestamp}] ${msg}`;
}

/**
 * Runtime executes side effects (commands) and dispatches resulting messages
 */
export async function runCmd(
  cmd: Cmd,
  dispatch: (msg: Msg) => void
): Promise<void> {
  if (cmd.type === "none") {
    return;
  }

  if (cmd.type === "Ping") {
    try {
      console.log("[RUNTIME] PING_START");
      const result = await ping();
      console.log("[RUNTIME] PING_OK:", result);
      dispatch({ type: "PingSucceeded", result });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[RUNTIME] PING_FAIL:", errorMsg);
      dispatch({ type: "PingFailed", error: errorMsg });
    }
    return;
  }

  if (cmd.type === "RunTutor") {
    const logs: string[] = [];
    
    try {
      // Log request details
      const requestStr = JSON.stringify(cmd.request, null, 2);
      logs.push(logMsg(`REQUEST: topic=${cmd.request.topic} mode=${cmd.request.mode} lang=${cmd.request.lang}`));
      logs.push(logMsg(`PARAMS: ${Object.keys(cmd.request.params).join(", ")}`));
      console.log("[RUNTIME] Request:", requestStr);
      
      logs.push(logMsg("INVOKE_START"));
      console.log("[RUNTIME] INVOKE_START");
      console.log("[RUNTIME] Executing RunTutor command...");
      
      // Get raw stdout from Tauri
      const rawStdout = await runTutorRaw(cmd.request);
      
      logs.push(logMsg(`INVOKE_DONE len=${rawStdout?.length ?? 0}`));
      console.log("[RUNTIME] INVOKE_DONE len:", rawStdout.length);
      console.log("[RUNTIME] Received stdout, length:", rawStdout.length);
      
      // Trim and check for empty
      const trimmed = (rawStdout ?? "").trim();
      if (trimmed === "") {
        logs.push(logMsg("ERROR: Empty stdout"));
        console.error("[RUNTIME] Empty stdout received");
        dispatch({
          type: "PracticeRunFailed",
          error: "Core returned empty stdout (no JSON).",
          raw: "(empty)",
          logs,
        });
        return;
      }
      
      // Try to parse JSON
      logs.push(logMsg("PARSE_START"));
      console.log("[RUNTIME] PARSE_START");
      
      let response: any;
      try {
        response = JSON.parse(trimmed);
        const keys = Object.keys(response);
        const resultKeys = response.result ? Object.keys(response.result) : [];
        logs.push(logMsg(`PARSE_OK keys=${keys.join(",")}`));
        logs.push(logMsg(`RESULT_KEYS: ${resultKeys.join(",") || "(none)"}`));
        console.log("[RUNTIME] PARSE_OK keys:", keys);
        console.log("[RUNTIME] Result keys:", resultKeys);
        console.log("[RUNTIME] JSON parse succeeded");
      } catch (parseError) {
        // JSON parsing failed - show preview
        const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
        const preview = trimmed.slice(0, 100);
        
        logs.push(logMsg(`PARSE_FAIL: ${errMsg}`));
        logs.push(logMsg(`PARSE_FAIL preview: ${preview}...`));
        console.error("[RUNTIME] PARSE_FAIL:", errMsg);
        console.error("[RUNTIME] JSON parse failed:", errMsg);
        
        dispatch({
          type: "PracticeRunFailed",
          error: `Failed to parse core response as JSON.\n\nParse error: ${errMsg}`,
          raw: trimmed, // Store full raw output
          logs,
        });
        return;
      }
      
      // Success - store both parsed response and raw string
      const raw = JSON.stringify(response, null, 2);
      logs.push(logMsg("SUCCESS"));
      console.log("[RUNTIME] SUCCESS");
      console.log("[RUNTIME] RunTutor succeeded, dispatching success");
      dispatch({ type: "PracticeRunSucceeded", response, raw, logs });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logs.push(logMsg(`INVOKE_THROW: ${errorMsg}`));
      console.error("[RUNTIME] INVOKE_THROW:", errorMsg);
      console.error("[RUNTIME] RunTutor failed:", errorMsg);
      dispatch({ type: "PracticeRunFailed", error: errorMsg, logs });
    }
    return;
  }

  if (cmd.type === "SelfTest") {
    const logs: string[] = [];
    logs.push(logMsg("[SELF-TEST] Starting 3 test requests..."));
    
    const testCases = [
      {
        name: "BubbleSort Pseudocode",
        request: {
          version: "1.0",
          topic: "bubblesort",
          mode: "pseudocode",
          lang: "de" as const,
          params: { arr: [5, 2, 8, 1] },
        },
      },
      {
        name: "BinarySearch Pseudocode",
        request: {
          version: "1.0",
          topic: "binarysearch",
          mode: "pseudocode",
          lang: "de" as const,
          params: { arr: [1, 3, 5, 7, 9], target: 5 },
        },
      },
      {
        name: "SearchContains Trace Exam",
        request: {
          version: "1.0",
          topic: "search_contains",
          mode: "trace_exam",
          lang: "de" as const,
          params: { case: "contains", arr: [1, 3, 5, 7, 9], target: 7 },
        },
      },
    ];

    let passCount = 0;
    let failCount = 0;

    for (const testCase of testCases) {
      try {
        logs.push(logMsg(`[SELF-TEST] Running: ${testCase.name}`));
        const rawStdout = await runTutorRaw(testCase.request);
        const trimmed = rawStdout.trim();
        
        if (trimmed === "") {
          logs.push(logMsg(`[SELF-TEST] ❌ FAIL ${testCase.name}: Empty stdout`));
          failCount++;
          continue;
        }

        const response = JSON.parse(trimmed);
        if (response.result) {
          logs.push(logMsg(`[SELF-TEST] ✅ PASS ${testCase.name}`));
          passCount++;
        } else {
          logs.push(logMsg(`[SELF-TEST] ❌ FAIL ${testCase.name}: No result field`));
          failCount++;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logs.push(logMsg(`[SELF-TEST] ❌ FAIL ${testCase.name}: ${errMsg}`));
        failCount++;
      }
    }

    logs.push(logMsg(`[SELF-TEST] Complete: ${passCount} passed, ${failCount} failed`));
    
    // Dispatch summary as log
    dispatch({ type: "PracticeAddLog", log: logs.join("\n") });
    return;
  }
}
