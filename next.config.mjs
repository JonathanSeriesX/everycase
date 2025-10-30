import nextra from "nextra";

const withNextra = nextra({
  // ... Other Nextra config options
  whiteListTagsStyling: ["h1"],
});

// You can include other Next.js configuration options here, in addition to Nextra settings:
export default withNextra({
  // ... Other Next.js config options
  images: {
    domains: ["everycase.org", "cloudfront.everycase.org"],
    unoptimized: true,
    //quality: 100,
    formats: ["image/avif", "image/webp"],
    imageSizes: [512, 1536],
  },
});
