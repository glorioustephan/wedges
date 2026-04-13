import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, sep } from "node:path";

export const slugify = (value: string) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");

export const toPosixPath = (value: string) => value.split(sep).join("/");

export const repoRelative = (root: string, target: string) => toPosixPath(relative(root, target));

export const unique = <T>(values: Iterable<T>) => [...new Set(values)];

export const sorted = <T>(values: Iterable<T>, compare?: (left: T, right: T) => number) =>
  [...values].sort(compare);

export const ensureDir = async (path: string) => {
  await mkdir(path, { recursive: true });
};

export const readText = (path: string) => readFile(path, "utf8");

export const writeJson = async (path: string, value: unknown) => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const listFiles = async (
  root: string,
  predicate: (path: string) => boolean
): Promise<string[]> => {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = `${root}/${entry.name}`;

      if (entry.isDirectory()) {
        return listFiles(path, predicate);
      }

      return predicate(path) ? [path] : [];
    })
  );

  return files.flat();
};

export const fileExists = async (path: string) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

export const sentence = (value: string) => {
  const [firstSentence] = value.replace(/\s+/g, " ").trim().match(/.*?[.!?](\s|$)/) ?? [];
  return firstSentence?.trim() ?? value.trim();
};

export const chunkText = (value: string, maxLength = 400) => {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

export const normalizeQueryTokens = (value: string) =>
  unique(value.toLowerCase().match(/[a-z0-9@._:/\-\[\]=]+/g) ?? []);

export const normalizeLookupValue = (value: string) => value.toLowerCase().trim().replace(/\s+/g, " ");

export const expandLookupValues = (value: string) => {
  const normalized = normalizeLookupValue(value);

  if (!normalized) {
    return [] as string[];
  }

  const spaced = normalized.replace(/[@._:/\-\[\]=]+/g, " ").replace(/\s+/g, " ").trim();
  const values = new Set<string>([normalized]);

  if (spaced) {
    values.add(spaced);
  }

  if (normalized.includes(" ")) {
    values.add(normalized.replace(/\s+/g, "-"));
    values.add(normalized.replace(/\s+/g, "."));
  }

  if (spaced.includes(" ")) {
    values.add(spaced.replace(/\s+/g, "-"));
    values.add(spaced.replace(/\s+/g, "."));
  }

  return [...values].filter(Boolean);
};

export const maybeJsonParse = <T>(value: string | null | undefined, fallback: T) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const compareStrings = (left: string, right: string) => left.localeCompare(right);

export const titleFromSlug = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const safeEval = <T>(expression: string): T => {
  const evaluator = new Function(`"use strict"; return (${expression});`);
  return evaluator() as T;
};
