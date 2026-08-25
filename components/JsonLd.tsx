/**
 * Renders a schema.org object as an application/ld+json script tag.
 * `<` is escaped so catalogue strings can never break out of the script
 * element (the one XSS vector JSON.stringify leaves open).
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
