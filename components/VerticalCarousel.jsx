import { cache } from "react";
import VerticalCarouselClient from "./VerticalCarousel.client";
import {
  filterCases,
  getAllCasesFromCSV,
} from "../lib/getCasesFromCSV";

const getCachedCases = cache(() => getAllCasesFromCSV());

const VerticalCarousel = (props) => {
  const { model, material, season } = props;
  const allCases = getCachedCases();
  const cases = filterCases(allCases, { model, material, season });

  return <VerticalCarouselClient {...props} cases={cases} />;
};

export default VerticalCarousel;
