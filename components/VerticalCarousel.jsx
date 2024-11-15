import { useState, useEffect } from "react";
import { Table, Td, Th, Tr } from "nextra/components";
import { supabase } from "./supabaseClient";
import Link from "next/link";
import Image from "next/image";

const VerticalCarousel = ({ model, material, season }) => {
  const [cases, setCases] = useState([]);
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

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div style={{ overflowX: "auto", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>
        <Table style={{}}>
          <thead>
          <Tr>
            <Th>Colour</Th>
            {cases.map((item) => (
              <Td key={item.SKU}>{item.colour}</Td>
            ))}
          </Tr>
          <Tr>
            <Th>SKU</Th>
            {cases.map((item) => (
              <Td key={item.SKU}>{item.SKU + "ZM/A"}</Td>
            ))}
          </Tr>
          <Tr>
            <Th>Tap for more:</Th>
            {cases.map((item) => (
              <Td key={item.SKU}>
                <Link href={"/case/" + item.SKU}>
                  <div
                    style={{
                      width: "200px",
                      height: "200px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Image
                      src={"https://cloudfront.everycase.org/everypreview/" + item.SKU + ".webp"}
                      width={400}
                      height={400}
                      alt={`${item.model} ${item.material} — ${item.colour}`}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </Link>
              </Td>
            ))}
          </Tr>
          </thead>
        </Table>
      </div>
      {cases.length === 0 && <p>No cases found for model {model}.</p>}
    </>
  );
};

export default VerticalCarousel;