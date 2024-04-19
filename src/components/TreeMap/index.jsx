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

const TreeMap = memo(function TreeMap(props) {
  const {
    setNumTrees,
    setSpeciesCount,
    setTotalSpeciesCount,
    totalSpeciesCount,
    setTreeColors,
    searchBarValue,
  } = props;

  const popupRef = useRef();
  const [showPopup, setShowPopup] = useState(true);
  const [clickCoor, setClickCoor] = useState([0, 0]);
  const [popup, setPopup] = useState(<></>);
  const [search, setSearch] = useState("");
  const [map, setMap] = useState(<></>);
  const [opacity, setOpacity] = useState(1);
  const [pal, setPal] = useState("orange");
  const [conn, setConn] = useState("");
  const [geojson, setGeojson] = useState({});
  const [whichMap, setWhichMap] = useState("pmtiles");

  const [mapLoaded, setMapLoaded] = useState(false);
  const [lastCount, setLastCount] = useState(Date.now());
  const mapRef = useRef();

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (searchBarValue.length > 0) {
      let s = searchBarValue.map((v) => v.id);
      const thisSp = totalSpeciesCount.filter((c) =>
        s.includes(c.essence_latin)
      );
      if (thisSp[0].count > 1000) {
        setWhichMap("pmtiles");
        setGeojson({});
        let ppal = ["case"];
        s.map((r, i) => {
          ppal.push(["==", ["get", "Essence_latin"], r]);
          ppal.push(1);
        });
        ppal.push(0);
        setOpacity(ppal);
      } else {
        setWhichMap("geojson");
        const sj = s.join(",");
        getTreesGeoJSON(sj).then((g) => {
          if (!ignore) {
            if (g.features?.length > 0) {
              let tc = {};
              setGeojson(g);
              let ppal = ["case"];
              s.map((r, i) => {
                ppal.push(["==", ["get", "Essence_latin"], r]);
                ppal.push(cols[i]);
                tc[r.essence_latin] = cols[i];
              });
              setTreeColors(tc);
              const bounds = mapRef.current.getBounds().toArray();
              getTreesSpeciesCount(
                bounds[0][0],
                bounds[1][0],
                bounds[0][1],
                bounds[1][1],
                1000,
                sj
              ).then((res) => {
                setSpeciesCount(res);
                tc = 0;
                res.forEach((m) => (tc += m.count));
                setNumTrees(tc);
              });
            }
          }
        });
      }
    } else {
      setWhichMap("pmtiles");
      setGeojson({});
      setOpacity(1);
    }
    return () => (ignore = true);
  }, [searchBarValue]);

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
    paint: {
      "circle-color": pal,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 0.1, 18, 6],
      "circle-opacity": opacity,
      "circle-stroke-opacity": opacity,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#333333",
    },
  };
  const geoJSONArbresLayer = {
    id: "arbres-geojson",
    source: "arbres-geojson",
    type: "circle",
    paint: {
      "circle-color": pal,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 18, 6],
      "circle-opacity": 1,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#333333",
    },
  };

  const Trees = () => {
    useEffect(() => {
      let ignore = false;
      if (mapRef.current && !mapLoaded) {
        setMapLoaded(true);
        mapRef.current.on("load", "arbres", function (e) {
          mapRef.current.on("movestart", () => {});
          mapRef.current.on("moveend", () => {
            if (Date.now() - lastCount > 3000) {
              const bounds = mapRef.current.getBounds().toArray();
              getTreesCount(
                bounds[0][0],
                bounds[1][0],
                bounds[0][1],
                bounds[1][1]
              ).then((conn) => {
                setNumTrees(conn[0][0]);
                getTreesSpeciesCount(
                  bounds[0][0],
                  bounds[1][0],
                  bounds[0][1],
                  bounds[1][1],
                  1000
                ).then((res) => {
                  setSpeciesCount(res);
                });
              });
            }
            /*if (features) {
              setNumTrees(features.length);
            }*/
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
        });
      }
      //return () => (ignore = true);
    }, [mapRef.current]);

    return (
      <Source
        id="arbres"
        type="vector"
        url={`pmtiles://https://object-arbutus.cloud.computecanada.ca/bq-io/arbres-test/arbres-test.pmtiles`}
      >
        <Layer {...arbresLayer} />
      </Source>
    );
  };

  const GeoJSONTrees = () => {
    useEffect(() => {
      let ignore = false;
      if (mapRef.current && !mapLoaded) {
        setMapLoaded(true);
        mapRef.current.on("load", "arbres", function (e) {
          mapRef.current.on("movestart", () => {
            // reset features filter as the map starts moving
            // mapRef.current.setFilter("airport", ["has", "abbrev"]);
          });

          mapRef.current.on("moveend", () => {});

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
        });
      }
      //return () => (ignore = true);
    }, [mapRef.current]);

    return (
      <Source id="arbres-geojson" type="geojson" data={geojson}>
        <Layer {...geoJSONArbresLayer} />
      </Source>
    );
  };

  useEffect(() => {
    let ppal = ["case"];
    /*Object.keys(tree_colors).map((m, i) => {
      ppal.push(["in", m, ["get", "Essence_latin"]]);
      ppal.push(tree_colors[i]);
    });
    ppal.push("orange");*/
    let tc = {};
    getTreesSpeciesCount(-78, -70, 44, 47, 1000).then((res) => {
      res.map((r, i) => {
        ppal.push(["==", ["get", "Essence_fr"], r.essence_fr]);
        ppal.push(cols[i]);
        tc[r.essence_latin] = cols[i];
      });
      ppal.push("orange");
      setTreeColors(tc);
      setPal(ppal);
      setSpeciesCount(res);
      setTotalSpeciesCount([...res]);
      const bounds = mapRef.current.getBounds().toArray();
      getTreesCount(
        bounds[0][0],
        bounds[1][0],
        bounds[0][1],
        bounds[1][1]
      ).then((conn) => {
        setNumTrees(conn[0][0]);
      });
    });
  }, [mapLoaded]);

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
        {whichMap === "pmtiles" && <Trees />}
        {whichMap === "geojson" && <GeoJSONTrees />}
        {showPopup && <> {popup} </>}
      </Map>
    </div>
  );
});

export default TreeMap;
