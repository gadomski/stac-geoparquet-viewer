import { Box, Container, GridItem, SimpleGrid } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapProvider } from "react-map-gl/dist/esm/exports-maplibre";
import Header from "./components/header";
import Map from "./components/map";
import Panel from "./components/panel";
import { Toaster } from "./components/ui/toaster";
import { StacMapProvider } from "./provider";

export default function App() {
  const queryClient = new QueryClient({});

  return (
    <QueryClientProvider client={queryClient}>
      <MapProvider>
        <StacMapProvider>
          <Box zIndex={0} position={"absolute"} top={0} left={0}>
            <Map></Map>
          </Box>
          <Container zIndex={1} fluid h={"dvh"} py={4} pointerEvents={"none"}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <GridItem colSpan={1} hideFrom={"md"}>
                <Box pointerEvents={"auto"}>
                  <Header></Header>
                </Box>
              </GridItem>
              <GridItem colSpan={1}>
                <Box pointerEvents={"auto"}>
                  <Panel></Panel>
                </Box>
              </GridItem>
              <GridItem colSpan={2} hideBelow={"md"}>
                <Box pointerEvents={"auto"}>
                  <Header></Header>
                </Box>
              </GridItem>
            </SimpleGrid>
          </Container>
          <Toaster></Toaster>
        </StacMapProvider>
      </MapProvider>
    </QueryClientProvider>
  );
}
