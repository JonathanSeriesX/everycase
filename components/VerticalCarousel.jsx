import { useState, useEffect } from "react";
import { Table, Td, Th, Tr } from "nextra/components";
import { supabase } from "./supabaseClient";
import Link from "next/link";
import Image from "next/image";

const VerticalCarousel = ({ model, material, season }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);

      let query = supabase
        .from("skus")
        .select("SKU, kind, colour, model, season, alt_thumbnail");

      if (model) query = query.ilike("model", model);
      if (material) query = query.ilike("kind", material);
      if (season) query = query.ilike("season", season);
      //ILIKE because it's case-insensitive

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

  // Detect viewport size and update state
  useEffect(() => {
    const handleResize = () => {
      setIsSmallViewport(window.innerWidth < 600); // Define "small" as < 768px
    };

    handleResize(); // Check initially
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div style={{ overflowX: "auto", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>
        <Table>
          <thead>
          {/* Row 1: Dummy Image and Color Name */}
          <Tr>
            <Td style={{ padding: "0", verticalAlign: "top", width: isSmallViewport ? "150px" : "200px" }}>
              <div
                style={{
                  width: isSmallViewport ? "125px" : "200px",
                  height: isSmallViewport ? "125px" : "200px",
                  marginTop: isSmallViewport ? "15px" : "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {/* Dummy image placeholder */}
              </div>
              <strong style={{ textAlign: "center", marginTop: "8px", display: "block", color: "#ccc" }}>
                Loading
              </strong>
            </Td>
          </Tr>

          {/* Row 2: Dummy SKU */}
          <Tr>
            <Td style={{ textAlign: "center", padding: "0" }}>
              <span style={{ color: "#ccc" }}>SKU</span>
            </Td>
          </Tr>
          </thead>
        </Table>
      </div>
    );
  }
  return (
    <>
      <div style={{ overflowX: "auto", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>
        <Table>
          <thead>
          {/* Row 1: Images and Color Names */}
          <Tr>
            {cases.map((item) => (
              <Td key={item.SKU}
                  style={{
                    padding: "0", verticalAlign: "top", width: isSmallViewport ? "150px" : "200px"
                  }}>
                <Link href={"/case/" + item.SKU}>
                  <div
                    style={{
                      width: isSmallViewport ? "125px" : "200px",
                      height: isSmallViewport ? "125px" : "200px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: isSmallViewport ? "15px" : "30px" // Dynamic margin
                    }}
                  >
                    <Image
                      src={"https://cloudfront.everycase.org/everypreview/" +
                        (item.alt_thumbnail || item.SKU).trim()
                        + ".webp"}
                      width={512}
                      height={512}
                      alt={`${item.model} ${item.kind} — ${item.colour}`}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </Link>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "50px", // Adjust height as needed for vertical centering
                    marginTop: "8px"
                  }}
                >
                  <strong style={{ textAlign: "center", marginLeft: "5px", marginRight: "5px" }}>
                    {item.colour === "Clear Case" ? item.model : item.colour}
                  </strong>
                </div>
              </Td>
            ))}
          </Tr>

          {/* Row 2: SKU */}
          <Tr>
            {cases.map((item) => (
              <Td key={item.SKU} style={{ padding: "0" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "50px" // Adjust height as needed for vertical centering
                  }}
                >
                    <span style={{ marginLeft: "4px", marginRight: "4px" }}>
                      {item.SKU + (isSmallViewport ? "ZM" : "ZM/A")}
                    </span>
                </div>
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

//TODO alt text does not work on Next/images.........

export default VerticalCarousel;