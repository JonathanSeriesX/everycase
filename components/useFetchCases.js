import { useState, useEffect } from "react";
import { fetchCases } from "./fetchCases";

const useFetchCases = (model, material, season) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await fetchCases(model, material, season);
      setCases(data);
      setLoading(false);
    };

    fetchData();
  }, [model, material, season]);

  return { cases, loading };
};

export default useFetchCases;