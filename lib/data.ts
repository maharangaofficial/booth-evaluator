export type Booth = {
  code: string;
  bu: string;
  theme: string;
  room: string;
};

export const BOOTHS: Booth[] = [
  { code: "CORPR&D_02", bu: "CORP - R&D", theme: "ASPIRO", room: "Aristotle Booth 1" },
  { code: "HRP_01", bu: "HRP", theme: "Engineering Intelligence", room: "Aristotle Booth 2" },
  { code: "CS-CIS/IMG_01", bu: "CORP SUPPORT - CIS/IMG", theme: "AGENTIC IT", room: "Aristotle Booth 3" },
  { code: "CORPR&D_03", bu: "CORP - R&D", theme: "Experience Ramco", room: "Aristotle Booth 4" },
  { code: "AAD_03", bu: "AAD", theme: "Task Card Digitalization", room: "Aristotle Booth 6" },
  { code: "HRP_02", bu: "HRP", theme: "Elevate. Engage. Excel. With PAYCE", room: "Aristotle Booth 7" },
  { code: "HRP_03", bu: "HRP", theme: "Payroll Bureau Intelligence Hub", room: "HR Floor Booth 1" },
  { code: "HRPMS_01", bu: "HRP - Managed Services", theme: "Behind Every Payslip, There Is A Story", room: "HR Floor Booth 2" },
  { code: "CORPR&D_01", bu: "CORP - R&D", theme: "Ask2Action AI", room: "HR Floor Booth 3" },
  { code: "AAD_02", bu: "AAD", theme: "Smarter Engine MRO", room: "HR Floor Booth 4" },
  { code: "AAD_01", bu: "AAD", theme: "AI Agents for Aviation", room: "HR Floor Booth 5" },
  { code: "ERP_01", bu: "ERP", theme: "ERP, Reimagined", room: "Plato Left 1" },
  { code: "ERP_02", bu: "ERP", theme: "The Road to Reality", room: "Plato Left 2" },
  { code: "ERP_03", bu: "ERP", theme: "Delivering Customer Success", room: "Plato Left 3" },
  { code: "CS-FIN_01", bu: "CORP SUPPORT - Finance", theme: "Paper ➡️ Prompt", room: "Plato Left 4" },
];

export const CRITERIA = [
  { key: "booth_experience", label: "Booth Experience & Engagement" },
  { key: "innovation", label: "Innovation" },
  { key: "reusability", label: "Reusability & Leverage" },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
