import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props) {
  const params = await props.params;
  const mdxPath = params.mdxPath ?? [];
  const { metadata } = await importPage(mdxPath);
  const baseMetadata = metadata ?? {};

  if (mdxPath.length === 0) {
    return {
      ...baseMetadata,
      title: {
        absolute: "Finest Woven",
      },
    };
  }

  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;
  const mdxPath = params.mdxPath ?? [];
  const result = await importPage(mdxPath);
  const { default: MDXContent, toc, metadata } = result;
  const baseMetadata = metadata ?? {};
  const pageMetadata =
    mdxPath.length === 0
      ? {
          ...baseMetadata,
          title: {
            absolute: "Finest Woven",
          },
        }
      : metadata;

  return (
    <Wrapper toc={toc} metadata={pageMetadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
