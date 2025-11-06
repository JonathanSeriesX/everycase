import { NotFoundPage } from "nextra-theme-docs";
import Image from "next/image";

export default function NotFound() {
  return (
    <NotFoundPage content="Report a broken link" labels="broken-link">
      <Image
        src="https://cloudfront.everycase.org/index.jpeg"
        alt="This bot is cooler btw"
        width={750}
        height={400}
      />
      <br />
      <h1>The cake may not be the truth.</h1>
    </NotFoundPage>
  );
}
