// Shared shapes for scan results. One source of truth: the results page,
// the Issues component, and the API all describe a finding the same way.

// Where an issue sits on the screenshot, in page pixels.
export type FindingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// One accessibility issue found by a scan.
export type Finding = {
  number: number;
  id: string;
  impact: string;
  help: string;
  description: string;
  helpUrl: string;
  selectors?: string[];
  boxes: FindingBox[];
};

// The scanned page's full size, used to place boxes as percentages.
export type PageDimensions = {
  width: number;
  height: number;
};
