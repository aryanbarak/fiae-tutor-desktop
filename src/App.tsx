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
import { ExportPage } from "./views/export/ExportPage";
import { ExamBankPage } from "./views/examBank/ExamBankPage";
import { WisoPage } from "./views/wiso/WisoPage";

function App() {
  // CRITICAL: Define refs and state BEFORE reducer to avoid initialization errors
  const cmdQueueRef = useRef<Cmd>({ type: "none" });
  const [cmdVersion, setCmdVersion] = useState(0);
  const [routePath, setRoutePath] = useState(() => window.location.pathname);

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

  useEffect(() => {
    const onPopState = () => setRoutePath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setRoutePath(path);
  };

  // Route to ExplainPage if mode is "explain", otherwise PracticePage
  const isExplainMode = state.practice.mode === "explain";
  const isExportRoute = routePath.startsWith("/export/");
  const isExamBankRoute = routePath === "/exam-bank";
  const isWisoRoute = routePath === "/wiso";

  return (
    <ErrorBoundary>
      {isExportRoute ? (
        <ExportPage />
      ) : (
        <div>
          <div style={styles.navBar}>
            <button
              type="button"
              style={{
                ...styles.navBtn,
                ...(isExamBankRoute || isWisoRoute ? {} : styles.navBtnActive),
              }}
              onClick={() => navigate("/")}
            >
              Tutor
            </button>
            <button
              type="button"
              style={{
                ...styles.navBtn,
                ...(isExamBankRoute ? styles.navBtnActive : {}),
              }}
              onClick={() => navigate("/exam-bank")}
            >
              Exam Bank (AP2)
            </button>
            <button
              type="button"
              style={{
                ...styles.navBtn,
                ...(isWisoRoute ? styles.navBtnActive : {}),
              }}
              onClick={() => navigate("/wiso")}
            >
              WISO
            </button>
          </div>
          {isExamBankRoute ? (
            <ExamBankPage />
          ) : isWisoRoute ? (
            <WisoPage />
          ) : isExplainMode ? (
            <ExplainPage model={state.practice} dispatch={dispatch} />
          ) : (
            <PracticePage model={state.practice} dispatch={dispatch} />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}

export default App;

const styles = {
  navBar: {
    display: "flex",
    gap: "0.4rem",
    alignItems: "center",
    padding: "0.5rem 0.75rem",
    borderBottom: "1px solid #253343",
    background: "#0d1218",
  },
  navBtn: {
    padding: "0.4rem 0.7rem",
    borderRadius: "6px",
    border: "1px solid #344559",
    background: "#17212d",
    color: "#ccd8e8",
    cursor: "pointer" as const,
    fontSize: "13px",
    fontWeight: 600,
  },
  navBtnActive: {
    borderColor: "#6ba2e8",
    background: "#213a57",
    color: "#e6f1ff",
  },
};
