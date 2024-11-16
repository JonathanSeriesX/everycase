import { supabase } from "./supabaseClient";

export const fetchCases = async (model, material, season) => {
  console.log(`[fetchCases] Querying data for ${model} ${material} ${season}`); // Debugging

  let query = supabase
    .from("skus")
    .select("SKU, kind, colour, model, season, alt_thumbnail");

  if (model) query = query.eq("model", model);
  if (material) query = query.ilike("kind", material);
  if (season) query = query.ilike("season", season);

  const { data, error } = await query;

  console.log("[fetchCases] Query Result:", { data, error });

  if (error) {
    console.error("Error fetching cases:", error);
    return [];
  }

  return data;
};