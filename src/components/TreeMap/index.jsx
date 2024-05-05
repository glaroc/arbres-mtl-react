import { useEffect, useState, useRef, useCallback, memo } from "react";
import "../../styles.css";
import { Map, Popup, Layer, Source } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
//import duckdb_init from "../../helpers/duckdb";
import randomcolor from "randomcolor";
import chroma from "chroma-js";
import _ from "lodash";

const TreeMap = (props) => {
  const {
    setNumTrees,
    setSpeciesCount,
    speciesCount,
    setTreeColors,
    treeColors,
    searchBarValue,
    species,
    lang,
    t,
  } = props;
  const popupRef = useRef();
  const [showPopup, setShowPopup] = useState(true);
  const [popup, setPopup] = useState(<></>);
  const [opacity, setOpacity] = useState(0);
  const defaultCircleRadius = [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    0.1,
    18,
    6,
  ];
  const [circleRadius, setCircleRadius] = useState(defaultCircleRadius);
  const [pal, setPal] = useState("orange");
  const [allPal, setAllPal] = useState("orange");
  const [whichMap, setWhichMap] = useState("pmtiles");
  const [filter, setFilter] = useState(["all"]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [lastCount, setLastCount] = useState(Date.now());
  const [processingFeatures, setProcessingFeatures] = useState(false);
  const [features, setFeatures] = useState([]);
  const [clickedPoint, setClickedPoint] = useState({});
  const mapRef = useRef();

  const arbresLayer = {
    id: "arbres",
    source: "arbres",
    "source-layer": "arbres",
    type: "circle",
    filter: filter,
    paint: {
      "circle-color": pal,
      "circle-radius": circleRadius,
      "circle-opacity": opacity,
      "circle-stroke-opacity": opacity,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#333333",
    },
  };

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  let cols = randomcolor({
    count: species.length,
    seed: 1111,
    luminosity: "bright",
  }).map((m) => chroma(m).desaturate().hex());

  useEffect(() => {
    if (species.length > 0 && mapLoaded) {
      let tc = {};
      let ppal = ["case"];
      species.map((r, i) => {
        ppal.push(["==", ["get", `essence_${lang}`], r[`essence_${lang}`]]);
        ppal.push(cols[i]);
        tc[r[`essence_${lang}`]] = cols[i];
      });
      ppal.push("orange");
      setTreeColors(tc);
      setPal(ppal);
      setAllPal(ppal);
      setOpacity(1);
    }
  }, [species, mapLoaded]);

  useEffect(() => {
    if (searchBarValue.length > 0) {
      if (mapRef.current) {
        setCircleRadius(["interpolate", ["linear"], ["zoom"], 5, 2, 18, 6]);
        let ppal = ["case"];
        let spf = ["any"];
        searchBarValue.map((r, i) => {
          ppal.push(["in", `-${r.id}-`, ["get", "sp_code"]]);
          ppal.push(treeColors[r.label]);
          spf.push(["in", `-${r.id}-`, ["get", "sp_code"]]);
        });
        ppal.push("orange");
        setFilter(spf);
        setPal(ppal);
      }
    } else {
      setFilter(["all"]);
      setPal(allPal);
    }
  }, [searchBarValue]);

  useEffect(() => {
    let ignore = false;
    if (features.length > 0 && species) {
      var sp = _.countBy(
        features
          .map((m) => m.properties.sp_code)
          .join(",")
          .split(",")
      );
      if (searchBarValue.length > 0) {
        let s = searchBarValue.map((v) => v.id);
        let ss = {};
        s.map((m) => (ss[m.replaceAll("-", "")] = sp[`-${m}-`]));
        sp = ss;
      }
      let topsp = _.take(_.sortBy(_.toPairs(sp), 1).reverse(), 8);
      const k = topsp.map((m) => {
        let s = m[0].replaceAll("-", "");
        return {
          sigle: s,
          [`essence_${lang}`]: _.find(species, { sigle: s })[`essence_${lang}`],
          count: m[1],
        };
      });
      const cnt = Object.values(sp).reduce((a, b) => a + b, 0);
      setSpeciesCount(k);
      setNumTrees(cnt);
    }
    return () => {
      ignore = true;
    };
  }, [features, filter, pal]);

  const PMTilesTrees = () => (
    <Source
      id="arbres"
      type="vector"
      url={`pmtiles://https://object-arbutus.cloud.computecanada.ca/arbres/mtl/pmtiles/arbres_mtl.pmtiles`}
    >
      <Layer {...arbresLayer} />
    </Source>
  );

  return (
    <div id="App" className="App">
      <Map
        ref={mapRef}
        //reuseMaps
        style={{ width: "100vw", height: "100vh" }}
        initialViewState={{
          longitude: -73.5,
          latitude: 45.53,
          zoom: 10,
        }}
        onMoveEnd={() => {
          setFeatures(
            mapRef.current.queryRenderedFeatures({
              layers: ["arbres"],
              validate: false,
            })
          );
        }}
        onLoad={() => {
          setMapLoaded(true);
          setFeatures(
            mapRef.current.queryRenderedFeatures({
              layers: ["arbres"],
              validate: false,
            })
          );
          mapRef.current.on("mouseenter", "arbres", () => {
            if (mapRef.current.getZoom() > 15) {
              mapRef.current.getCanvas().style.cursor = "pointer";
            }
          });
          mapRef.current.on("mouseleave", "arbres", () => {
            mapRef.current.getCanvas().style.cursor = "";
          });
        }}
        onClick={(e) => {
          if (mapRef.current.getZoom() > 14) {
            const feat = mapRef.current.queryRenderedFeatures(e.point);
            const popupText = feat.map(
              (f) =>
                `<ul style="list-style-type:none;text-align:left;margin-left:-30px"><li><strong>Espèce (fr)</strong>: ${
                  f.properties.essence_fr
                }</li><li><strong>${t("Espèce (en)", lang)}</strong>: ${
                  f.properties.essence_en
                }</li><li><strong>Nom scientifique</strong>: ${
                  f.properties.essence_latin
                }</li><li><strong>Diamètre (cm)</strong>: ${
                  f.properties.DHP
                }</li><li><strong>Date de la plantation</strong>: ${
                  f.properties.Date_plantation != ""
                    ? new Date(f.properties.Date_plantation).toLocaleDateString(
                        "fr-ca"
                      )
                    : "indisponible"
                }</li><li><strong>Date du dernier relevé</strong>: ${new Date(
                  f.properties.Date_releve
                ).toLocaleDateString("fr-ca")}</li></ul>`
            );
            if (feat.length === 0) {
              setShowPopup(false);
            } else {
              setShowPopup(true);
            }
            setPopup(
              <Popup
                latitude={e.lngLat.lat}
                longitude={e.lngLat.lng}
                closeOnClick={false}
                onClose={() => setShowPopup(false)}
                closeButton={true}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: popupText.join("<hr>"),
                  }}
                ></div>
              </Popup>
            );
          }
        }}
        mapStyle={{
          version: 8,
          sources: {
            background: {
              type: "raster",
              tiles: ["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "google-sat",
              source: "background",
              type: "raster",
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        }}
        mapLib={maplibregl}
      >
        <PMTilesTrees />
        {showPopup && <> {popup} </>}
      </Map>
    </div>
  );
};

export default TreeMap;
