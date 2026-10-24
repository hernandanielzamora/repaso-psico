export type Region = { x: number; y: number; width: number; height: number };
export type ReviewCriterion = { label: string; guidance: string; confusion: string };
export type AperceptiveMode = "W" | "D" | "Dd" | "Dde" | "Ddi" | "Ddr" | "Ddd" | "S" | "WS" | "SW" | "DS" | "SD" | "Do";
export type DeterminantRow = {
  response: string;
  inquiry: string;
  region: Region;
  codes: string[];
  explanation: string;
  mode: AperceptiveMode;
  localization: string;
  modeExplanation: string;
};
export type ProjectionExercise = {
  plate?: number;
  rows?: DeterminantRow[];
  fields?: { label: string; guide: string }[];
  phenomenon?: { names: string[]; clue: string; confusion: string };
  criteria: ReviewCriterion[];
};
