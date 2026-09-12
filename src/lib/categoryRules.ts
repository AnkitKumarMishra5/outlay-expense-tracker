import { Query } from "./db";
import type { CategoryRule } from "./categories";

export interface StoredRule extends CategoryRule {
  id: string;
}

/** The reader's own keyword mappings, longest keyword first so the most
 *  specific one wins when two of them match the same description. */
export async function loadRules(q: Query, userId: string): Promise<StoredRule[]> {
  const rs = await q("SELECT id, keyword, category FROM category_rules WHERE user_id = $1", [userId]);
  return rs.rows
    .map((r) => ({ id: r.id as string, keyword: r.keyword as string, category: r.category as string }))
    .sort((a, b) => b.keyword.length - a.keyword.length);
}
