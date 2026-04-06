import { publicUrl } from "@/lib/public-path";

export type GlossaryTerm = {
  id: string;
  label: string;
  description: string;
  aliases: string[];
};

export type GlossaryData = {
  terms: Record<string, GlossaryTerm>;
};

export type GlossaryIndex = Record<string, string[]>;

let glossaryCache: GlossaryData | null = null;
let glossaryIndexCache: GlossaryIndex | null = null;

export async function getGlossaryData(): Promise<GlossaryData> {
  if (glossaryCache) return glossaryCache;
  const res = await fetch(publicUrl("glossary.json"));
  if (!res.ok) throw new Error("Failed to fetch glossary.json");
  const data = (await res.json()) as GlossaryData;
  glossaryCache = data && typeof data === "object" ? data : { terms: {} };
  return glossaryCache;
}

export async function getGlossaryIndex(): Promise<GlossaryIndex> {
  if (glossaryIndexCache) return glossaryIndexCache;
  const res = await fetch(publicUrl("glossary-index.json"));
  if (!res.ok) throw new Error("Failed to fetch glossary-index.json");
  const data = (await res.json()) as GlossaryIndex;
  glossaryIndexCache = data && typeof data === "object" ? data : {};
  return glossaryIndexCache;
}

export async function getRelatedPostSlugsForTerm(termId: string): Promise<string[]> {
  const idx = await getGlossaryIndex();
  const arr = idx[termId];
  return Array.isArray(arr) ? arr : [];
}

