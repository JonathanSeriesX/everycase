"use client";

import { useEffect, useState } from "react";
import { Table } from "nextra/components";
import Link from "next/link";
import Image from "next/image";

const CAROUSEL_IMAGE_BASE_URL = "https://cloudfront.everycase.org/everypreview";
// /MF039 will be put in between these two
const CAROUSEL_IMAGE_BASE_FORMAT = "webp";

const VerticalCarouselClient = ({ cases = [], model, material, season }) => {
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallViewport(window.innerWidth < 600);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sortedCases = [...cases].sort((a, b) =>
    (a.SKU || "").localeCompare(b.SKU || ""),
  );

  const displayLabel = (itemColour, itemModel) => {
    if (
      typeof material === "string" &&
      material.trim().toLowerCase() === "clear case"
    ) {
      return itemModel || model;
    }
    if (itemColour === "Clear Case") {
      return model || itemModel;
    }
    return itemColour;
  };

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
            <Table.Tr>
              {sortedCases.map((item, index) => {
                const isPriorityImage = index < 5;
                const imageAlt = `${item.model} ${item.kind}${
                  item.kind === "Clear Case" ? "" : ` — ${item.colour}`
                }`;
                const imageCode = (item.alt_thumbnail || item.SKU || "").trim();
                const imageSrc = imageCode
                  ? `${CAROUSEL_IMAGE_BASE_URL}/${imageCode}.${CAROUSEL_IMAGE_BASE_FORMAT}`
                  : "";
                return (
                  <Table.Td
                    key={item.SKU}
                    style={{
                      padding: "0",
                      verticalAlign: "top",
                      width: isSmallViewport ? "125px" : "200px",
                    }}
                  >
                    <Link href={`/case/${item.SKU}`}>
                      <div
                        style={{
                          width: isSmallViewport ? "125px" : "200px",
                          height: isSmallViewport ? "125px" : "200px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: isSmallViewport ? "15px" : "30px",
                        }}
                      >
                        <Image
                          src={imageSrc}
                          width={512}
                          height={512}
                          alt={imageAlt}
                          style={{ objectFit: "contain" }}
                          fetchPriority={isPriorityImage ? "high" : "low"}
                          loading={isPriorityImage ? "eager" : "lazy"}
                          unoptimized="true"
                          title={imageAlt}
                        />
                      </div>
                    </Link>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "50px",
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
                        {displayLabel(item.colour, item.model)}
                      </strong>
                    </div>
                  </Table.Td>
                );
              })}
            </Table.Tr>
            <Table.Tr>
              {sortedCases.map((item) => (
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
                      {item.SKU + (isSmallViewport ? "ZM" : "ZM/A")}
                    </span>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>
            <Table.Tr>
              {sortedCases.map((item) => (
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
      {sortedCases.length === 0 && (
        <p>
          No cases found for model {model}
          {material ? ` — ${material}` : ""}
          {season ? ` — ${season}` : ""}.
        </p>
      )}
    </>
  );
};

export default VerticalCarouselClient;
