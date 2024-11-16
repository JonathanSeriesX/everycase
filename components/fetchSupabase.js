import { useState, useEffect } from "react";
import { fetchCases } from "./supabaseConnect";

/**
 * useFetchCases Hook
 *
 * A custom React hook for fetching phone case data from Supabase.
 *
 * This hook provides an easy way to query cases based on optional filters
 * (`model`, `material`, and `season`) and returns the resulting data along
 * with a loading state.
 *
 * @param {string|null} model - The model of the phone to filter cases (e.g., "iPhone 14"), or `null` for all models.
 * @param {string|null} material - The material of the case to filter by (e.g., "Leather"), or `null` for all materials.
 * @param {string|null} season - The season to filter cases (e.g., "Winter"), or `null` for all seasons.
 * @returns {Object} - An object containing:
 *   - `cases` (Array): The list of phone cases matching the filters.
 *   - `loading` (boolean): The current loading state of the data fetch.
 */
const useFetchCases = (model, material, season) => {
  const [cases, setCases] = useState([]); // Stores the fetched cases
  const [loading, setLoading] = useState(true); // Indicates whether data is being loaded

  useEffect(() => {
    /**
     * fetchData
     *
     * An async function that fetches case data based on the provided filters.
     * Updates the `cases` state with the fetched data and sets the `loading` state.
     */
    const fetchData = async () => {
      setLoading(true); // Set loading to true before fetching
      const data = await fetchCases(model, material, season); // Fetch data from Supabase
      setCases(data); // Update the cases state with the fetched data
      setLoading(false); // Set loading to false after fetching is complete
    };

    fetchData();
  }, [model, material, season]); // Rerun effect when filters change

  return { cases, loading }; // Return fetched data and loading state
};

export default useFetchCases;
