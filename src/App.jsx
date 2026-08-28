import { useEffect, useState, useRef, useCallback } from "react";
import "./styles.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useSearchParams } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  SwipeableDrawer,
} from "@mui/material";
import TreeMap from "./components/TreeMap";
import TreeBar2 from "./components/TreeBar2";
import { LayerSelector } from "./components/LayerSelector";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "./styles/theme";
import SearchBar from "./components/SearchBar";
import { getTreesNamesCount } from "./helpers/api";
import { t } from "./helpers/translations";
import logoQC from "./assets/arbres_qc_logo_150.png";
import logoMTL from "./assets/arbres_mtl_logo_150.png";

const logo = import.meta.env.VITE_CITY === "qc" ? logoQC : logoMTL;

import { styled } from "@mui/material";

export default function App(props) {
  const mapRef = useRef();
  const popupRef = useRef();
  const [numTrees, setNumTrees] = useState(0);
  const [speciesCount, setSpeciesCount] = useState([]);
  const [totalSpeciesCount, setTotalSpeciesCount] = useState([]);
  const [species, setSpecies] = useState([]);
  const [treeColors, setTreeColors] = useState({});
  const [searchBarValue, setSearchBarValue] = useState([]);
  const [options, setOptions] = useState([]);
  const [baseLayer, setBaseLayer] = useState(
    "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [lang, setLang] = useState("fr");
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  const city = import.meta.env.VITE_CITY || "mtl";

  useEffect(() => {
    let lan = "fr";
    if (window.location.href.includes("/fr/")) {
      lan = "fr";
    }
    if (window.location.href.includes("/en/")) {
      lan = "en";
    }
    if (searchParams.get("lang")) {
      lan = searchParams.get("lang");
    }
    if (lan === "fr" || lan === "en") {
      setLang(lan);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getTreesNamesCount(city).then((res) => {
      let names = res
        .sort((a, b) =>
          a[`essence_${lang}`]
            .toLowerCase()
            .localeCompare(b[`essence_${lang}`].toLowerCase(), lang),
        )
        .map((r) => ({
          label: r[`essence_${lang}`],
          id: r.sigle,
        }))
        .filter(
          (r) =>
            !r.label.toLowerCase().includes("nom") &&
            !r.label.toLowerCase().includes("name"),
        );
      setSpecies(res);
      setOptions(names);
    });
  }, [lang]);

  const notifyLayerChange = (layer) => {
    setBaseLayer(layer.layer_source_url);
  };

  const Puller = styled("div")(({ theme }) => ({
    width: 30,
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 3,
    position: "absolute",
    top: 0,
    left: "calc(50% - 30px)",
    marginTop: 4,
    ...theme.applyStyles("dark", {
      backgroundColor: "#fff",
    }),
  }));

  return (
    <ThemeProvider theme={theme}>
      {!isMobile && (
        <Grid container>
          <Grid xs={6} md={7} lg={9} item>
            <TreeMap
              city={city}
              setNumTrees={setNumTrees}
              setSpeciesCount={setSpeciesCount}
              speciesCount={speciesCount}
              setTotalSpeciesCount={setTotalSpeciesCount}
              species={species}
              treeColors={treeColors}
              setTreeColors={setTreeColors}
              searchBarValue={searchBarValue}
              baseLayer={baseLayer}
              lang={lang}
              t={t}
            />
            <LayerSelector notifyLayerChange={notifyLayerChange} />
          </Grid>
          <Grid id = "ui-tray"
            xs={6}
            md={5}
            lg={3}
            item
            sx={{ background: "#333333", padding: "20px", zIndex: 99 }}
          >
            <Tray
              {...{
                city,
                searchBarValue,
                speciesCount,
                setSearchBarValue,
                treeColors,
                numTrees,
                options,
                lang,
                t,
              }}
            />
          </Grid>
        </Grid>
      )}
      {isMobile && (
        <Box id="ui-tray-mobile"
          sx={{
            position: "relative",
            overflow: "visible",
            backghroundColor: "#333",
          }}
        >
          <SwipeableDrawer
            anchor="bottom"
            open={open}
            onClose={() => {
              setOpen(false);
            }}
            onOpen={() => {
              setOpen(true);
            }}
            swipeAreaWidth={56}
            disableSwipeToOpen={false}
            keepMounted
            sx={{ overflow: "visible" }}
          >
            <Box
              sx={{
                position: "relative",
                overflow: "visible",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                visibility: "visible",
                right: 0,
                left: 0,
                top: -56,
                backgroundColor: "#333",
                marginTop: "10px",
              }}
            >
              <Puller />
            </Box>
            <Tray
              {...{
                city,
                searchBarValue,
                speciesCount,
                setSearchBarValue,
                treeColors,
                numTrees,
                options,
                lang,
                t,
              }}
            />
          </SwipeableDrawer>
          <Grid container>
            <Grid xs={12} item>
              <>
                <TreeMap
                  city={city}
                  setNumTrees={setNumTrees}
                  setSpeciesCount={setSpeciesCount}
                  speciesCount={speciesCount}
                  setTotalSpeciesCount={setTotalSpeciesCount}
                  species={species}
                  treeColors={treeColors}
                  setTreeColors={setTreeColors}
                  searchBarValue={searchBarValue}
                  baseLayer={baseLayer}
                  lang={lang}
                  t={t}
                />
                <LayerSelector notifyLayerChange={notifyLayerChange} />
              </>
            </Grid>
          </Grid>
        </Box>
      )}
    </ThemeProvider>
  );
}

export function Tray({
  city,
  searchBarValue,
  speciesCount,
  setSearchBarValue,
  treeColors,
  numTrees,
  options,
  lang,
  t,
}) {
  return (
    <Grid container spacing={3} sx={{ background: "#333333" }}>
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
              {import.meta.env.VITE_PAGE_TITLE || "Arbres publics"}
            </Typography>
          </Grid>
          <Grid item xs={3} sx={{ background: "none", textAlign: "center" }}>
            <Box
              sx={{
                background: `url("${logo}")`,
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
            <Typography sx={{ color: "#8cc63f", fontSize: 12 }}>
              {t("Nombre d'arbres à l'écran", lang)}
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
          treeColors={treeColors}
          lang={lang}
          t={t}
        ></SearchBar>
      </Grid>
      <Grid item xs={12}>
        <Card sx={{ background: "#333333" }} elevation={0}>
          <CardContent sx={{ paddingTop: 0 }}>
            <Typography sx={{ fontSize: 30, color: "white" }}>
              <TreeBar2
                data={speciesCount}
                treeColors={treeColors}
                lang={lang}
                t={t}
              />
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sx={{ bottom: "20px" }}>
        <Typography
          sx={{
            fontSize: "22px",
            fontFamily: "'Roboto Slab', serif",
            fontWeight: "bold",
            color: "#8cc63f",
            float: "right",
            background: "#222",
            width: "25px",
            padding: "5px 0px 5px 15px",
            borderRadius: "20px",
          }}
        >
          <a
            style={{ color: "#8cc63f" }}
            target="_blank"
            href={
              city === "mtl"
                ? "http://quebio.ca/fr/arbres_mtl_desc"
                : "http://quebio.ca/fr/arbres_qc_desc"
            }
          >
            ?
          </a>
        </Typography>
      </Grid>
    </Grid>
  );
}
