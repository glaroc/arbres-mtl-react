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

  const defaultCircleRadius = [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    0.1,
    18,
    6,
  ];
  const popupRef = useRef();
  const [showPopup, setShowPopup] = useState(true);
  const [popup, setPopup] = useState(<></>);
  const [opacity, setOpacity] = useState(1);
  const [circleRadius, setCircleRadius] = useState(defaultCircleRadius);
  const [pal, setPal] = useState("orange");
  const [whichMap, setWhichMap] = useState("pmtiles");
  const [mapBounds, setMapBounds] = useState([]);

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
    setWhichMap("");
    if (searchBarValue.length > 0) {
      let s = searchBarValue.map((v) => v.id);
      const thisSp = totalSpeciesCount.filter((c) =>
        s.includes(c.essence_latin)
      );
      let ppal = ["case"];
      s.map((r, i) => {
        ppal.push(["in", r, ["get", "Essence_latin"]]);
        ppal.push(1);
      });
      ppal.push(0);
      setOpacity(ppal);
      setCircleRadius(["interpolate", ["linear"], ["zoom"], 5, 2, 18, 6]);
    } else {
      //initBars();
      setOpacity(1);
    }
    setWhichMap("pmtiles");
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
      "circle-radius": circleRadius,
      "circle-opacity": opacity,
      "circle-stroke-opacity": opacity,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#333333",
    },
  };
  const removeListeners = () => {
    if (mapRef.current) {
    }
  };

  const PMTilesTrees = (props) => {
    const { searchBarValue, setNumTrees } = props;
    const [features, setFeatures] = useState([]);

    const updateBounds = (sb) => {};

    useEffect(() => {
      let cnt = 0;
      if (features.length > 0) {
        if (searchBarValue.length > 0) {
          let s = searchBarValue.map((v) => v.id);
          features.map((f) => {
            cnt =
              cnt +
              f.properties.Essence_latin.split(",").reduce(function (a, e, i) {
                if (s.includes(e)) a.push(i);
                return a;
              }, []).length;
          });
        } else {
          features.map((f) => {
            cnt = cnt + f.properties.Essence_latin.split(",").length;
          });
        }
      }
      setNumTrees(cnt);
    }, [features]);

    useEffect(() => {
      let ignore = false;
      if (mapRef.current) {
        setMapLoaded(true);
        setFeatures(mapRef.current.queryRenderedFeatures());
        mapRef.current.on("load", "arbres", () => {
          mapRef.current.on("movestart", () => {});
          mapRef.current.on("moveend", () => {
            setFeatures(mapRef.current.queryRenderedFeatures());
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
      return () => {
        ignore = true;
        if (mapRef.current) {
          mapRef.current.on("movestart", () => {});
          mapRef.current.on("moveend", () => {
            setFeatures(mapRef.current.queryRenderedFeatures());
          });
          setFeatures(mapRef.current.queryRenderedFeatures());
        }
      };
    }, [mapRef.current, searchBarValue]);

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

  const initBars = () => {
    if (mapRef.current) {
      let ppal = ["case"];
      /*Object.keys(tree_colors).map((m, i) => {
      ppal.push(["in", m, ["get", "Essence_latin"]]);
      ppal.push(tree_colors[i]);
    });
    ppal.push("orange");*/
      let tc = {};
      const bounds = mapRef.current.getBounds().toArray();
      getTreesSpeciesCount(
        bounds[0][0],
        bounds[1][0],
        bounds[0][1],
        bounds[1][1],
        1000
      ).then((res) => {
        let totc = 0;
        res.map((r, i) => {
          ppal.push(["==", ["get", "Essence_fr"], r.essence_fr]);
          ppal.push(cols[i]);
          tc[r.essence_latin] = cols[i];
          totc = totc + r.count;
        });
        //setNumTrees(totc);
        ppal.push("orange");
        setTreeColors(tc);
        setPal(ppal);
        setSpeciesCount(res);
        setTotalSpeciesCount([...res]);
      });
    }
  };

  useEffect(() => {
    initBars();
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
        {whichMap === "pmtiles" && (
          <PMTilesTrees
            searchBarValue={searchBarValue}
            setNumTrees={setNumTrees}
          />
        )}
        {showPopup && <> {popup} </>}
      </Map>
    </div>
  );
});

export default TreeMap;
