import { createId } from '@/lib/db';

export interface TipLabelItem {
  id: string;
  name: string;
}

export function parseSerializedLabels(serialized: string | null | undefined) {
  if (!serialized) {
    return [] as TipLabelItem[];
  }

  const items = serialized
    .split('||')
    .map((entry) => {
      const [id, name] = entry.split('::');
      if (!id || !name) {
        return null;
      }

      return { id, name } as TipLabelItem;
    })
    .filter((item): item is TipLabelItem => Boolean(item));

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function normalizeTextList(values: unknown) {
  if (!Array.isArray(values)) {
    return [] as string[];
  }

  const set = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    set.add(normalized);
  }

  return [...set];
}

export function normalizeLabelIds(values: unknown) {
  return normalizeTextList(values);
}

export function normalizeLabelNames(values: unknown) {
  return normalizeTextList(values);
}

export async function resolveTipLabels(params: {
  db: D1Database;
  labelIds: string[];
  newLabels: string[];
}) {
  const { db, labelIds, newLabels } = params;
  const map = new Map<string, TipLabelItem>();

  for (const labelId of labelIds) {
    const row = await db
      .prepare(`SELECT id, name FROM "TipLabel" WHERE id = ? LIMIT 1`)
      .bind(labelId)
      .first<TipLabelItem>();

    if (row) {
      map.set(row.id, row);
    }
  }

  for (const labelName of newLabels) {
    const existing = await db
      .prepare(`SELECT id, name FROM "TipLabel" WHERE lower(name) = lower(?) LIMIT 1`)
      .bind(labelName)
      .first<TipLabelItem>();

    if (existing) {
      map.set(existing.id, existing);
      continue;
    }

    const id = createId();
    await db.prepare(`INSERT INTO "TipLabel" (id, name) VALUES (?, ?)`).bind(id, labelName).run();
    map.set(id, { id, name: labelName });
  }

  return [...map.values()];
}
