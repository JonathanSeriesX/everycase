import { supabase } from "./supabaseClient";

/**
 * Fetches phone cases from the Supabase "skus" table.
 * Not a Hook? Ok I'll have to figure this stuff out.
 *
 * @param {string|null} [model] - The model of the phone to filter by (e.g., "iPhone 14 Pro"), or `null` to skip.
 * @param {string|null} [material] - The material of the case to filter by (e.g., "Leather Case"), or `null` to skip.
 * @param {string|null} [season] - The season to filter by (e.g., "Autumn 2020"), or `null` to skip.
 * @returns {Promise<Array>} - An array of matching phone cases.
 */
export const fetchCases = async (
  model = null,
  material = null,
  season = null,
) => {
  const isDevelopment = process.env.NODE_ENV === "development"; // Check environment

  if (isDevelopment) {
    console.log(
      `[fetchCases] Querying data for ${model || "all models"} ${material || "all materials"} ${season || "all seasons"}`,
    ); // Debugging
  }

  try {
    let query = supabase
      .from("skus")
      .select("SKU, kind, colour, model, season, alt_thumbnail");

    // Add filters only if the parameter is not null
    if (model) query = query.eq("model", model.trim());
    if (material) query = query.ilike("kind", `%${material.trim()}%`);
    if (season) query = query.ilike("season", `%${season.trim()}%`);

    const { data, error } = await query;

    if (isDevelopment) {
      console.log("[fetchCases] Query Result:", { data, error });
    }

    if (error) {
      console.error("[fetchCases] Error fetching cases:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    if (isDevelopment) {
      console.error("[fetchCases] Unexpected error:", err);
    }
    return [];
  }
};
