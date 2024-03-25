import { useEffect, useState, useRef, useCallback } from "react";
import "./styles.css";
import { Map, Popup } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import type { MapRef } from "react-map-gl";
import { useLocation } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Box,
  Select,
  OutlinedInput,
  Chip,
  Typography,
  MenuItem,
  FilledInput,
  InputLabel,
  Input,
  TextField,
} from "@mui/material";
//import AtlasHex from "./components/AtlasHex";
import TreeMap from "./components/TreeMap";
import TreeBar2 from "./components/TreeBar2";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "./styles/theme";
import { getSources, getAtlasExportDates } from "./helpers/api";
import {
  CustomButtonCABO,
  CustomAutocomplete,
  CustomPaper,
} from "./styles/customMUI";

//getObsDatasetSummary({null,null,9999,0,null,region_fid})

export default function App(props: any) {
  const mapRef: any = useRef<MapRef>();
  const popupRef: any = useRef<maplibregl.Popup>();
  const [showPopup, setShowPopup] = useState<boolean>(true);
  const [clickCoor, setClickCoor]: any = useState([0, 0]);
  const [popup, setPopup] = useState(<></>);
  const [search, setSearch] = useState("");
  const [numTrees, setNumTrees]: any = useState(0);
  const [speciesCount, setSpeciesCount]: any = useState([]);
  const [sources, setSources]: any = useState([]);
  const [atlasDates, setAtlasDates]: any = useState([]);
  const [selectedDate, setSelectedDate] = useState("2024-01-01");
  const [treeColors, setTreeColors] = useState({});
  const [select, setSelect] = useState(<></>);

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;

  const DATADATE = "2024-01-24";
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 8.5 + ITEM_PADDING_TOP,
        width: 600,
      },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container>
        <Grid xs={9} item>
          <TreeMap
            setNumTrees={setNumTrees}
            setSpeciesCount={setSpeciesCount}
            setTreeColors={setTreeColors}
          />
        </Grid>
        <Grid
          xs={3}
          item
          sx={{ background: "#white", padding: "12px", zIndex: 99 }}
        >
          <Card>
            <CardContent>
              <Typography>Number of trees on screen</Typography>
              <Typography sx={{ fontSize: 30 }}>
                {new Intl.NumberFormat("en-CA").format(numTrees)}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ paddingTop: 0 }}>
              <Typography sx={{ fontSize: 30 }}>
                <TreeBar2 data={speciesCount} treeColors={treeColors} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
