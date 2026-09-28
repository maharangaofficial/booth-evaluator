export const BOOTHS = [
  "Booth 1",
  "Booth 2",
  "Booth 3",
  "Booth 4",
  "Booth 5",
];

export const CRITERIA = [
  { key: "creativity", label: "Creativity" },
  { key: "presentation", label: "Presentation" },
  { key: "technical", label: "Technical Execution" },
  { key: "impact", label: "Overall Impact" },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
