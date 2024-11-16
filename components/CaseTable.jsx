import { useState, useEffect } from "react";
import { Table, Td, Th, Tr } from "nextra/components";
import { supabase } from "./supabaseClient";
import Link from "next/link";
import Image from "next/image";


/**
 * DEPRECATED, TO BE REMOVED
 * CaseTable Component
 * 
 * Displays a table of phone cases based on filters like model, material, and season.
 * Fetches data from a Supabase database and displays it in a sortable table.
 * 
 * @param {string} model - The model of the phone to filter cases.
 * @param {string} material - The material of the case to filter cases.
 * @param {string} season - The season to filter cases.
 * @returns {JSX.Element} A table of filtered phone cases.
 */
const CaseTable = ({ model, material, season }) => {
  const [cases, setCases] = useState([]);
  const [sortField] = useState("color");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);

      let query = supabase.from("phone").select("SKU, material, colour, model, season");

      if (model) query = query.eq("model", model);
      if (material) query = query.eq("material", material);
      if (season) query = query.eq("season", season);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching cases:", error);
      } else {
        setCases(data);
      }

      setLoading(false);
    };

    fetchCases();
  }, [model, material, season]);

  const sortedCases = [...cases].sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1;
    if (a[sortField] > b[sortField]) return 1;
    return 0;
  });

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Table>
        <thead>
          <Tr>
            <Th>Colour</Th>
            <Th>SKU</Th>
            <Th>Tap for more:</Th>
          </Tr>
        </thead>
        <tbody>
          {sortedCases.map((item) => (
            <Tr key={item.SKU}>
              <Td>{item.colour}</Td>
              <Td>{item.SKU + "ZM/A"}</Td>
              <Td>
                <Link href={"/case/" + item.SKU}>
                  <div style={{
                    width: "200px", height: "200px", overflow: "hidden", display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Image
                      src={"https://cloudfront.everycase.org/everypreview/" + item.SKU + ".webp"}
                      width={200} height={200}
                      alt={item.model + " " + item.material + " — " + item.colour}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </Link>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      {cases.length === 0 && <p>No cases found for model {model}.</p>}
    </>
  );
};

//TODO image alt text does not work for some reason??

export default CaseTable;
