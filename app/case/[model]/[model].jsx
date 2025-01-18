import LightboxComponent from "../../components/LightboxComponent";
import { Callout } from "nextra/components";
import fs from "fs";
import { useFetchCases } from "../../components/fetchCSV";
import SingleImage from "../../components/SingleImage";
import Head from "next/head";

export const getStaticProps = async ({ params }) => {
  const { model } = params;

  try {
    // Fetch SKU details from skus.csv
    const records = useFetchCases();
    const data = records.find((record) => record.SKU === model);

    if (!data) {
      console.warn(`[getStaticProps] No data found for model: ${model}`);
      return { notFound: true };
    }

    // Fetch image filenames from filenames.txt
    const filePath = "scripts/filenames.txt";
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const matchingModels = fileContents
      .split("\n")
      .filter((line) => line.startsWith(model))
      .map((line) => line.trim());

    // Construct the case name
    const modelNumberMatch = data.model.match(/iPhone (\d+)/);
    const isMagSafeModel =
      modelNumberMatch && parseInt(modelNumberMatch[1], 10) >= 12;

    const caseName = isMagSafeModel
      ? `${data.model} ${data.kind} with MagSafe${
          data.colour !== "Clear Case" ? ` — ${data.colour}` : ""
        }`
      : `${data.model} ${data.kind}${
          data.colour !== "Clear Case" ? ` — ${data.colour}` : ""
        }`;

    return {
      props: {
        modelName: model,
        matchingModels,
        caseName,
      },
    };
  } catch (error) {
    console.error(`[getStaticProps] Error:`, error);
    return { notFound: true };
  }
};

export const getStaticPaths = async () => {
  try {
    // Fetch SKUs from skus.csv
    const records = useFetchCases();

    // Extract unique SKUs from the first column
    const uniqueSKUs = Array.from(
      new Set(records.map((record) => record.SKU.trim()))
    );

    const paths = uniqueSKUs.map((sku) => ({
      params: { model: sku },
    }));

    //console.log(`[getStaticPaths] Generated paths:`, paths);

    return {
      paths,
      fallback: false, // Disable fallback for now
    };
  } catch (error) {
    console.error(`[getStaticPaths] Error:`, error);
    return {
      paths: [],
      fallback: false, // Return empty paths on error
    };
  }
};

export default function ModelPage({
  modelName,
  matchingModels = [],
  caseName,
}) {
  //console.log(`[ModelPage] Rendering page with props:`, { modelName, matchingModels, caseName }); // Debugging props

  const images = matchingModels.map((variant) => ({
    src: `https://cloudfront.everycase.org/everysource/${variant}.webp`,
    alt: caseName,
  }));

  // TODO TITLE = COLOUR + KIND — FINEST WOVEN
  return (
    <>
      <Head>
        <title>{caseName + " — Finest Woven"}</title>
      </Head>
      <main>
        <h1 className="_mt-2 _text-4xl _font-bold _tracking-tight _text-slate-900 dark:_text-slate-100">
          {caseName}
        </h1>
        <Callout type="info" emoji="👉🏻">
          <strong>{modelName}ZM</strong> is an order number for this product,
          used for search engines, auction websites and such.
        </Callout>
        <div style={{ marginTop: "1rem" }}>
          {matchingModels.length === 1 ? (
            <SingleImage
              image={`https://cloudfront.everycase.org/everysource/${matchingModels[0]}.webp`}
              alt={`${caseName}`}
            />
          ) : (
            <LightboxComponent images={images} />
          )}
        </div>
      </main>
    </>
  );
}
