/**
 * Domain types for FIAE Tutor Core communication
 */

// Request sent to Python core
export interface CoreRequest {
  version: string;
  topic: string;
  mode: string;
  lang: "de" | "fa" | "bi";
  params: Record<string, any>;
}

// Response from Python core
export interface CoreResponse {
  request_id: string;
  result: any;
  events: any[];
  stats: any;
}
