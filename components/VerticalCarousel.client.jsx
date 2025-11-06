"use client";

import { useEffect, useState } from "react";
import { Table } from "nextra/components";
import Link from "next/link";
import Image from "next/image";

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

  const showModelPrefix = (colour) =>
    colour === "Clear Case" ? model : colour;

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
              {cases.map((item) => (
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
                        src={`https://cloudfront.everycase.org/everypreview/${(
                          item.alt_thumbnail || item.SKU
                        ).trim()}.webp`}
                        width={512}
                        height={512}
                        alt={`${item.model} ${item.kind} — ${item.colour}`}
                        style={{ objectFit: "contain" }}
                        //loading="eager"
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
                      {showModelPrefix(item.colour)}
                    </strong>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>
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
                      {item.SKU + (isSmallViewport ? "ZM" : "ZM/A")}
                    </span>
                  </div>
                </Table.Td>
              ))}
            </Table.Tr>
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
      {cases.length === 0 && (
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
