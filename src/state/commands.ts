import { CoreRequest } from "../domain/types";

/**
 * Commands represent side effects to be executed (MVU pattern)
 */
export type Cmd = 
  | { type: "none" } 
  | { type: "RunTutor"; request: CoreRequest }
  | { type: "Ping" }
  | { type: "SelfTest" };
