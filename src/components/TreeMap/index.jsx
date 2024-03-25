import { useEffect, useState, useRef, useCallback } from "react";
import "../../styles.css";
import { Map, Popup, Layer, Source } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useLocation } from "react-router-dom";
//import duckdb_init from "../../helpers/duckdb";
import { getTreesCount, getTreesSpeciesCount } from "../../helpers/api";
import randomcolor from "randomcolor";

export default function TreeMap(props) {
  const { setNumTrees, setSpeciesCount, setTreeColors } = props;

  const popupRef = useRef();
  const [showPopup, setShowPopup] = useState(true);
  const [clickCoor, setClickCoor] = useState([0, 0]);
  const [popup, setPopup] = useState(<></>);
  const [search, setSearch] = useState("");
  const [map, setMap] = useState(<></>);
  const [opacity, setOpacity] = useState(0.6);
  const [pal, setPal] = useState("orange");
  const [conn, setConn] = useState("");
  const [lastCount, setLastCount] = useState(Date.now());
  const mapRef = useRef();

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

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

  const cols = randomcolor({
    count: 850,
    seed: 1111,
    luminosity: "bright",
  });

  const arbresLayer = {
    id: "arbres",
    source: "arbres",
    "source-layer": "arbres",
    type: "circle",
    paint: {
      "circle-color": pal,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 1.5, 18, 6],
      "circle-opacity": 1,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#333333",
    },
  };

  const Trees = () => {
    /*useEffect(() => {
      let ignore = false;
      duckdb_init().then((conn) => {
        if (!ignore) {
          setConn(conn);
        }
      });
      return () => (ignore = true);
    }, []);*/
    useEffect(() => {
      if (mapRef.current) {
        mapRef.current.on("load", "arbres", function (e) {
          const bounds = mapRef.current.getBounds().toArray();
          getTreesCount(
            bounds[0][0],
            bounds[1][0],
            bounds[0][1],
            bounds[1][1]
          ).then((conn) => {
            setNumTrees(conn[0][0]);
          });
          mapRef.current.on("movestart", () => {
            // reset features filter as the map starts moving
            // mapRef.current.setFilter("airport", ["has", "abbrev"]);
          });

          mapRef.current.on("moveend", () => {
            /*const features = mapRef.current.querySourceFeatures({
              sourceLayer: "arbres",
            });
            const features = mapRef.current.queryRenderedFeatures({
              layers: ["arbres"],
            });*/
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
                  bounds[1][1]
                ).then((res) => {
                  setSpeciesCount(res);
                });
              });
            }
            /*if (features) {
              setNumTrees(features.length);
            }*/
          });
          mapRef.current.on("click", "atlas", (e) => {
            if (mapRef.current.getZoom() > 14) {
              const features = mapRef.current?.queryRenderedFeatures(e.point);
              const popupText = features.map(
                (f) =>
                  `<strong>Espèce</strong>: ${f.properties.valid_scientific_name}<br><strong>Jeu de données</strong>: ${f.properties.dataset_name}`
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
      setSpeciesCount(
        res.map((r, i) => {
          if (i < 10) {
            return r;
          } else {
            return false;
          }
        })
      );
    });
  }, []);

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
              tiles: ["http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
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
        <Trees />
        {showPopup && <> {popup} </>}
      </Map>
    </div>
  );
}
