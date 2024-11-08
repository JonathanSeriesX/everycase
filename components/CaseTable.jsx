import { useState, useEffect } from "react";
import { Table, Td, Th, Tr } from "nextra/components";
import { supabase } from "./supabaseClient";
import Link from "next/link";
import Image from "next/image";

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
              <Link href={"/latest-iphone/iphone-15/" + item.SKU}><Image
                src={"https://cloudfront.everycase.org/everypreview/" + item.SKU + ".webp"}
                width={400} height={400}
                alt={"hello?" + item.model + " with " + item.colour + " " + item.material}
              /></Link>
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
