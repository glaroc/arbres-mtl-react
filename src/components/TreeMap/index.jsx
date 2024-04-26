import { useEffect, useState, useRef, useCallback, memo } from "react";
import "../../styles.css";
import { Map, Popup, Layer, Source } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useLocation } from "react-router-dom";
//import duckdb_init from "../../helpers/duckdb";
import {
  getTreesCount,
  getTreesSpeciesCount,
  getTreesGeoJSON,
} from "../../helpers/api";
import randomcolor from "randomcolor";
import chroma from "chroma-js";
import _ from "lodash";

const TreeMap = (props) => {
  const {
    setNumTrees,
    setSpeciesCount,
    setTreeColors,
    searchBarValue,
    species,
  } = props;
  const popupRef = useRef();
  const [showPopup, setShowPopup] = useState(true);
  const [popup, setPopup] = useState(<></>);
  const [opacity, setOpacity] = useState(1);
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
  const [whichMap, setWhichMap] = useState("pmtiles");
  const [filter, setFilter] = useState(["all"]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [lastCount, setLastCount] = useState(Date.now());
  const [features, setFeatures] = useState([]);
  const mapRef = useRef();

  const tree_colors = {
    Acer: "lightgreen",
    Quercus: "purple",
    Fraxinus: "lightblue",
    Betula: "white",
    Populus: "yellow",
    Tilia: "chocolate",
    Pinus: "goldenrod",
    Ulmus: "cyan",
    Juglans: "brown",
  };

  let cols = randomcolor({
    count: 850,
    seed: 1111,
    luminosity: "bright",
  }).map((m) => chroma(m).desaturate().hex());

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

  useEffect(() => {
    if (species.length > 0 && mapLoaded) {
      let tc = {};
      let ppal = ["case"];
      species.map((r, i) => {
        ppal.push(["==", ["get", "Essence_fr"], r.essence_fr]);
        ppal.push(cols[i]);
        tc[r] = cols[i];
      });
      ppal.push("orange");
      setTreeColors(tc);
      setPal(ppal);
    }
  }, [species]);

  useEffect(() => {
    if (searchBarValue.length > 0) {
      if (mapRef.current) {
        let s = searchBarValue.map((v) => v.id);
        const thisSp = species.filter((c) => s.includes(c));
        let ppal = ["all"];
        s.map((r, i) => {
          ppal.push(["in", r, ["get", "SIGLE"]]);
        });
        setFilter(ppal);
        mapRef.current.setFilter("arbres", ppal);
      }
      setCircleRadius(["interpolate", ["linear"], ["zoom"], 5, 2, 18, 6]);
      setPal("orange");
    } else {
      setFilter(["all"]);
    }
  }, [searchBarValue]);

  useEffect(() => {
    let cnt = 0;
    let totc = 0;
    if (features.length > 0) {
      var sp = _.countBy(
        features
          .map((m) => m.properties.SIGLE)
          .join(",")
          .split(",")
      );
      if (searchBarValue.length > 0) {
        let s = searchBarValue.map((v) => v.id);
        let ss = {};
        s.map((m) => (ss[m] = sp[m]));
        sp = ss;
      }
      let topsp = _.take(_.sortBy(_.toPairs(sp), 1).reverse(), 8);
      const k = topsp.map((m) => {
        return {
          essence_fr: _.find(species, { sigle: m[0] }).essence_fr,
          count: m[1],
        };
      });
      setSpeciesCount(k);
      cnt = Object.values(sp).reduce((a, b) => a + b, 0);
      setNumTrees(cnt);
    }
  }, [features]);

  const PMTilesTrees = () => {
    useEffect(() => {
      let ignore = false;
      if (mapRef.current) {
        setMapLoaded(true);
        mapRef.current.on("load", () => {
          setFeatures(mapRef.current.queryRenderedFeatures());
          mapRef.current.on("movestart", () => {});
          mapRef.current.on("moveend", () => {
            setFeatures(mapRef.current.queryRenderedFeatures());
          });
        });
        mapRef.current.on("mouseenter", "arbres", () => {
          if (mapRef.current.getZoom() > 14) {
            mapRef.current.getCanvas().style.cursor = "pointer";
          }
        });
        mapRef.current.on("mouseleave", "arbres", () => {
          mapRef.current.getCanvas().style.cursor = "";
        });

        mapRef.current.on("click", "arbres", (e) => {
          if (mapRef.current.getZoom() > 14) {
            const features = mapRef.current?.queryRenderedFeatures(e.point);
            const popupText = features.map(
              (f) => `<strong>Espèce</strong>: ${f.properties.Essence_fr}`
            );

            setShowPopup(true);
            setPopup(
              <Popup
                latitude={e.lngLat.lat}
                longitude={e.lngLat.lng}
                closeOnClick={true}
                onClose={() => setShowPopup(false)}
                closeButton={false}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: popupText.join("<hr>"),
                  }}
                ></div>
              </Popup>
            );
          }
        });
      }
      return () => {
        if (mapRef.current) {
          mapRef.current.off("load", () => {
            mapRef.current.off("movestart", () => {});
            mapRef.current.off("moveend", () => {
              setFeatures(mapRef.current.queryRenderedFeatures());
            });
          });
        }
      };
    }, [mapRef.current]);

    return (
      <Source
        id="arbres"
        type="vector"
        url={`pmtiles://https://object-arbutus.cloud.computecanada.ca/arbres/mtl/pmtiles/arbres_mtl.pmtiles`}
      >
        <Layer {...arbresLayer} />
      </Source>
    );
  };

  return (
    <div id="App" className="App">
      <Map
        ref={mapRef}
        style={{ width: "100vw", height: "100vh" }}
        initialViewState={{
          longitude: -73.5,
          latitude: 45.53,
          zoom: 10,
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
        {whichMap === "pmtiles" && <PMTilesTrees />}
        {showPopup && <> {popup} </>}
      </Map>
    </div>
  );
};

export default TreeMap;
