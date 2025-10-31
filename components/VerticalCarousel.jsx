"use client";

import { useEffect, useState } from "react";
import { Table } from "nextra/components";
import Link from "next/link";
import Image from "next/image";

function useCases(model, material) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    const params = new URLSearchParams();
    if (model) params.set("model", model);
    if (material) params.set("material", material);

    setLoading(true);
    fetch(`/api/cases?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!aborted) setCases(json.data || []);
      })
      .catch(() => {
        if (!aborted) setCases([]);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [model, material]);

  return { cases, loading };
}

const VerticalCarousel = ({ model, material }) => {
  const { cases, loading } = useCases(model, material);

  const [isSmallViewport, setIsSmallViewport] = useState(false);

  // Detect viewport size and update state
  useEffect(() => {
    const handleResize = () => {
      setIsSmallViewport(window.innerWidth < 600); // Define "small" as < 768px
    };

    handleResize(); // Check initially
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cases = incomingCases ?? [];
  const baseSize = isSmallViewport ? 125 : 200;
  const imageMarginTop = isSmallViewport ? 15 : 30;
  const skuSuffix = isSmallViewport ? "ZM" : "ZM/A";

  if (!cases.length) {
    const materialLabel = material ? `${material} ` : "";
    return (
      <div
        style={{
          border: "1px solid #333",
          borderRadius: "12px",
          padding: "16px",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <Table>
          {/* Dummy Image and Color Name to avoid layout shifts */}
          <tbody>
            <Table.Tr>
              <Table.Td
                style={{
                  padding: "0",
                  verticalAlign: "top",
                  width: isSmallViewport ? "150px" : "200px",
                }}
              >
                <div
                  style={{
                    width: isSmallViewport ? "125px" : "200px",
                    height: isSmallViewport ? "125px" : "200px",
                    marginTop: isSmallViewport ? "15px" : "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                ></div>
                <strong
                  style={{
                    textAlign: "center",
                    marginTop: "8px",
                    display: "block",
                    color: "#ccc",
                  }}
                >
                  Loading
                </strong>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td style={{ textAlign: "center", padding: "0" }}>
                <span style={{ color: "#ccc" }}>SKU</span>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td style={{ textAlign: "center", padding: "0" }}>
                <span style={{ color: "#ccc" }}>Season</span>
              </Table.Td>
            </Table.Tr>
          </tbody>
        </Table>
      </div>
    );
  }
  return (
    <>
      <div
        style={{
          overflowX: "auto",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table>
          <tbody>
            {/* Row 1: Images and Color Names */}
            <Table.Tr>
              {cases.map((item) => (
                <Table.Td
                  key={item.SKU}
                  style={{
                    padding: "0",
                    verticalAlign: "top",
                    width: baseSize,
                  }}
                >
                  <Link href={"/case/" + item.SKU}>
                    <div
                      style={{
                        width: baseSize,
                        height: baseSize,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: imageMarginTop, // Dynamic margin
                      }}
                    >
                      <Image
                        src={
                          "https://cloudfront.everycase.org/everypreview/" +
                          (item.alt_thumbnail || item.SKU).trim() +
                          ".webp"
                        }
                        width={512} //does not affect anything anyway??
                        height={512}
                        alt={`${item.model} ${item.kind} — ${item.colour}`}
                        style={{ objectFit: "contain" }}
                        loading="eager"
                      />
                    </div>
                  </Link>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "50px", // Adjust height as needed for vertical centering
                      marginTop: "8px",
                    }}
                  >
                    <strong
                      style={{
                        textAlign: "center",
                        marginLeft: "5px",
                        marginRight: "5px",
                      }}
                    >
                      {item.colour === "Clear Case" ? item.model : item.colour}
                    </strong>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>

            {/* Row 2: SKU */}
            <Table.Tr>
              {cases.map((item) => (
                <Table.Td key={item.SKU} style={{ padding: "0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "50px", // Adjust height as needed for vertical centering
                    }}
                  >
                    <span style={{ marginLeft: "4px", marginRight: "4px" }}>
                      {item.SKU + skuSuffix}
                    </span>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>

            {/* Row 3: Season */}
            <Table.Tr>
              {cases.map((item) => (
                <Table.Td key={item.SKU} style={{ padding: "0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "50px",
                    }}
                  >
                    <span style={{ marginLeft: "4px", marginRight: "4px" }}>
                      {item.season || "—"}
                    </span>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>

            {/* Row 3: Season */}
            <Table.Tr>
              {cases.map((item) => (
                <Table.Td key={item.SKU} style={{ padding: "0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "50px",
                    }}
                  >
                    <span style={{ marginLeft: "4px", marginRight: "4px" }}>
                      {item.season || "—"}
                    </span>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>
          </tbody>
        </Table>
      </div>
    </>
  );
};

//TODO alt text does not work on Next/images.........?

export default VerticalCarousel;
