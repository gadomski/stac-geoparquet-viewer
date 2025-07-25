import { useContext } from "react";
import { StacMapContext } from "../context";

export default function useStacMap() {
  const context = useContext(StacMapContext);
  if (context) {
    return context;
  } else {
    throw new Error("useStacMap must be used from within a StacMapProvider");
  }
}
