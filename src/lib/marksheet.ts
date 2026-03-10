import * as XLSX from "xlsx";

export type ImportedMarksheetRow = {
  delegate_name: string;
  committee_name: string;
  diplomacy: number;
  research: number;
  speaking: number;
};

const parseNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 0;
};

const readTextFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsText(file);
  });

export async function parseMarksheetFile(file: File): Promise<ImportedMarksheetRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await readTextFile(file);
    const workbook = XLSX.read(text, { type: "string" });
    return normalizeWorksheet(workbook);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  return normalizeWorksheet(workbook);
}

function normalizeWorksheet(workbook: XLSX.WorkBook): ImportedMarksheetRow[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows
    .map((row) => {
      const delegate_name = String(row.Delegate ?? row["Participant Name"] ?? row.Participant ?? "").trim();
      const committee_name = String(row.Committee ?? row.Event ?? "General").trim() || "General";

      return {
        delegate_name,
        committee_name,
        diplomacy: parseNumber(row.Diplomacy ?? row["Judge 1"]),
        research: parseNumber(row.Research ?? row["Judge 2"]),
        speaking: parseNumber(row.Speaking ?? row["Judge 3"]),
      };
    })
    .filter((row) => row.delegate_name.length > 0);
}
