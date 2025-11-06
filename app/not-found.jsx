import { NotFoundPage } from "nextra-theme-docs";
import Image from "next/image";

export default function NotFound() {
  return (
    <NotFoundPage content="Submit an issue" labels="broken-link">
      <Image
        src="https://r2.everycase.org/index.jpeg"
        alt="This bot is cooler btw"
        width={750}
        height={400}
      />
      <br />
      <h1>The cake might not be the truth.</h1>
    </NotFoundPage>
  );
}
