import { useReducer, useEffect, useRef, useState } from "react";
import "./App.css";
import { initialModel } from "./state/model";
import { update } from "./state/update";
import { Msg } from "./state/actions";
import { Cmd } from "./state/commands";
import { runCmd } from "./app/runtime";
import { PracticePage } from "./views/PracticePage";
import { ExplainPage } from "./views/explain/ExplainPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  // CRITICAL: Define refs and state BEFORE reducer to avoid initialization errors
  const cmdQueueRef = useRef<Cmd>({ type: "none" });
  const [cmdVersion, setCmdVersion] = useState(0);

  // MVU architecture with useReducer
  const [state, dispatch] = useReducer(
    (model: ReturnType<typeof initialModel>, msg: Msg) => {
      try {
        const { model: newModel, cmd } = update(model, msg);
        
        // CRITICAL: Validate newModel is defined and has required shape
        if (!newModel || !newModel.practice) {
          console.error("[REDUCER] update() returned invalid model:", newModel);
          console.error("[REDUCER] Falling back to previous model");
          return model; // Return previous valid state
        }
        
        // Store command for execution in effect
        if (cmd.type !== "none") {
          cmdQueueRef.current = cmd;
          // Increment version to trigger effect
          setCmdVersion((v) => v + 1);
        }
        return newModel;
      } catch (error) {
        console.error("[REDUCER] Exception in update():", error);
        console.error("[REDUCER] Message was:", msg);
        // Return previous state on error - NEVER crash React
        return model;
      }
    },
    initialModel()
  );

  // Execute commands via effect (triggered by cmdVersion, not state)
  useEffect(() => {
    const cmd = cmdQueueRef.current;
    if (cmd.type !== "none") {
      console.log("[EXEC CMD]", cmd.type);
      // Clear immediately to prevent re-execution
      cmdQueueRef.current = { type: "none" };
      // Execute async command
      runCmd(cmd, dispatch).catch((err) => {
        console.error("[EXEC CMD ERROR]", err);
        // Fail-safe: dispatch error if uncaught
        dispatch({
          type: "PracticeRunFailed",
          error: `Command execution error: ${err instanceof Error ? err.message : String(err)}`,
        });
      });
    }
  }, [cmdVersion]);

  // Route to ExplainPage if mode is "explain", otherwise PracticePage
  const isExplainMode = state.practice.mode === "explain";

  return (
    <ErrorBoundary>
      {isExplainMode ? (
        <ExplainPage model={state.practice} dispatch={dispatch} />
      ) : (
        <PracticePage model={state.practice} dispatch={dispatch} />
      )}
    </ErrorBoundary>
  );
}

export default App;
