import { Box, FileUpload, Icon } from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";
import useStacMap from "../hooks/stac-map";

export default function Upload() {
  const { fileUpload } = useStacMap();

  return (
    <FileUpload.RootProvider alignItems="stretch" value={fileUpload}>
      <FileUpload.HiddenInput />
      <FileUpload.Dropzone bg="bg.panel" mx={2} mb={2}>
        <Icon size="md" color="fg.muted">
          <LuUpload />
        </Icon>
        <FileUpload.DropzoneContent>
          <Box>Drag and drop STAC JSON or GeoParquet here</Box>
        </FileUpload.DropzoneContent>
      </FileUpload.Dropzone>
      <FileUpload.List />
    </FileUpload.RootProvider>
  );
}
