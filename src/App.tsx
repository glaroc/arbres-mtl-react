import { useEffect, useState, useRef, useCallback } from "react";
import "./styles.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import type { MapRef } from "react-map-gl";
import { useSearchParams } from "react-router-dom";
import { Grid, Card, CardContent, Box, Typography } from "@mui/material";
import TreeMap from "./components/TreeMap";
import TreeBar2 from "./components/TreeBar2";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import theme from "./styles/theme";
import SearchBar from "./components/SearchBar";
import { getTreesNamesCount } from "./helpers/api";
import { t } from "./helpers/translations";

export default function App(props: any) {
  const mapRef: any = useRef<MapRef>();
  const popupRef: any = useRef<maplibregl.Popup>();
  const [numTrees, setNumTrees]: any = useState(0);
  const [speciesCount, setSpeciesCount]: any = useState([]);
  const [totalSpeciesCount, setTotalSpeciesCount]: any = useState([]);
  const [species, setSpecies]: any = useState([]);
  const [treeColors, setTreeColors] = useState({});
  const [searchBarValue, setSearchBarValue] = useState([]);
  const [options, setOptions] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [lang, setLang]: any = useState("fr");

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
    getTreesNamesCount().then((res) => {
      let names = res
        .sort((a: any, b: any) =>
          a[`essence_${lang}`]
            .toLowerCase()
            .localeCompare(b[`essence_${lang}`].toLowerCase(), lang)
        )
        .map((r: any) => ({
          label: r[`essence_${lang}`],
          id: r.sigle,
        }))
        .filter(
          (r: any) =>
            !r.label.toLowerCase().includes("nom") &&
            !r.label.toLowerCase().includes("name")
        );
      setSpecies(res);
      setOptions(names);
    });
  }, [lang]);

  return (
    <ThemeProvider theme={theme}>
      <Grid container>
        <Grid xs={6} md={7} lg={9} item>
          <TreeMap
            setNumTrees={setNumTrees}
            setSpeciesCount={setSpeciesCount}
            speciesCount={speciesCount}
            setTotalSpeciesCount={setTotalSpeciesCount}
            species={species}
            treeColors={treeColors}
            setTreeColors={setTreeColors}
            searchBarValue={searchBarValue}
            lang={lang}
            t={t}
          />
        </Grid>
        <Grid
          xs={6}
          md={5}
          lg={3}
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
                    {`${t("Arbres publics de Montréal", lang)}`}
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={3}
                  sx={{ background: "none", textAlign: "center" }}
                >
                  <Box
                    sx={{
                      background: `url("/sites/all/modules/quebio/templates/arbres-pmtiles-react/${"icon_150.png"}")`,
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
                  href="http://quebio.ca/fr/arbres_mtl_desc"
                >
                  ?
                </a>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
