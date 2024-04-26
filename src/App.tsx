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
import SearchBar from "./components/SearchBar";
import { getTreesNamesCount } from "./helpers/api";

export default function App(props: any) {
  const mapRef: any = useRef<MapRef>();
  const popupRef: any = useRef<maplibregl.Popup>();
  const [showPopup, setShowPopup] = useState<boolean>(true);
  const [clickCoor, setClickCoor]: any = useState([0, 0]);
  const [popup, setPopup] = useState(<></>);
  const [search, setSearch] = useState("");
  const [numTrees, setNumTrees]: any = useState(0);
  const [speciesCount, setSpeciesCount]: any = useState([]);
  const [totalSpeciesCount, setTotalSpeciesCount]: any = useState([]);
  const [sources, setSources]: any = useState([]);
  const [species, setSpecies]: any = useState([]);
  const [selectedDate, setSelectedDate] = useState("2024-01-01");
  const [treeColors, setTreeColors] = useState({});
  const [select, setSelect] = useState(<></>);
  const [searchBarValue, setSearchBarValue] = useState([]);
  const [options, setOptions] = useState([]);

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

  const searchButtonClicked = () => {};

  useEffect(() => {
    let ignore = false;
    getTreesNamesCount().then((res) => {
      if (!ignore) {
        let names = res
          .sort((a: any, b: any) => {
            return a.essence_fr
              .toLowerCase()
              .localeCompare(b.essence_fr.toLowerCase(), "fr");
          })
          .map((r: any) => ({
            label: r.essence_fr,
            id: r.sigle,
          }));
        setSpecies(res);
        setOptions(names);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Grid container>
        <Grid xs={9} item>
          <TreeMap
            setNumTrees={setNumTrees}
            setSpeciesCount={setSpeciesCount}
            setTotalSpeciesCount={setTotalSpeciesCount}
            species={species}
            setTreeColors={setTreeColors}
            searchBarValue={searchBarValue}
          />
        </Grid>
        <Grid
          xs={3}
          item
          sx={{ background: "#333333", padding: "20px", zIndex: 99 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Grid container>
                <Grid item xs={9} sx={{ paddingLeft: "20px" }}>
                  <Typography
                    sx={{
                      fontSize: "32px",
                      fontFamily: "'Roboto Slab', serif",
                      fontWeight: "bold",
                      color: "white",
                    }}
                  >
                    Arbres publics de Montréal
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={3}
                  sx={{ background: "none", textAlign: "center" }}
                >
                  <Box
                    sx={{
                      background: `url("${"icon_150.png"}")`,
                      width: "60px",
                      height: "60px",
                      backgroundSize: "cover",
                      padding: "15px",
                      backgroundColor: "white",
                    }}
                  ></Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={8} sx={{ marginLeft: "20px" }}>
              <Card
                sx={{
                  border: "1px solid #8cc63f",
                  borderRadius: "10px",
                  background: "none",
                  padding: "0px",
                  height: "90px",
                }}
                elevation={5}
              >
                <CardContent sx={{ paddingTop: "10px", paddingBottom: "0px" }}>
                  <Typography sx={{ color: "#8cc63f" }}>
                    Nombre d'arbres à l'écran
                  </Typography>
                  <Typography
                    sx={{ fontSize: 30, color: "white", fontWeight: "bold" }}
                  >
                    {new Intl.NumberFormat("en-CA").format(numTrees)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={10} sx={{ marginLeft: "20px" }}>
              <SearchBar
                options={options}
                searchBarValue={searchBarValue}
                setSearchBarValue={setSearchBarValue}
                searchButtonClicked={searchButtonClicked}
                treeColors={treeColors}
              ></SearchBar>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ background: "#333333" }} elevation={0}>
                <CardContent sx={{ paddingTop: 0 }}>
                  <Typography sx={{ fontSize: 30, color: "white" }}>
                    <TreeBar2 data={speciesCount} treeColors={treeColors} />
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
