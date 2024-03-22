import { useEffect, useState, useRef, useCallback } from "react";
import "../../styles.css";
import { Map, Popup } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import type { MapRef } from "react-map-gl";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function AtlasHex() {
  const mapRef: any = useRef<MapRef>();
  const popupRef: any = useRef<maplibregl.Popup>();
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [clickCoor, setClickCoor]: any = useState([0, 0]);
  const [popupText, setPopupText] = useState("Test");
  const [pal, setPal]: any = useState("#00000000");
  const [outline, setOutline] = useState("#00000000");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(5);

  const get_col = (num: number) => {
    if (num < 0.25) {
      return "yellow";
    } else if (num < 0.5) {
      return "orange";
    } else if (num < 0.75) {
      return "red";
    } else if (num < 1) {
      return "#222222";
    }
    return "black";
  };

  const zoom_scale = (zoom: number) => {
    if (zoom <= 5) {
      return 50;
    } else if (zoom <= 8) {
      return 20;
    } else {
      return 10;
    }
  };

  const getObs = async (
    scale: number,
    min_x: number,
    min_y: number,
    max_x: number,
    max_y: number,
    which: string = "count_obs"
  ) => {
    const resp = await axios.post(
      "https://atlas.biodiversite-quebec.ca/api/v2/rpc/obs_map_values_slippy",
      {
        region_type: "hex",
        zoom: scale,
        taxa_group_key: 12,
        min_year: 1950,
        max_year: 9999,
        x_min: min_x,
        y_min: min_y,
        x_max: max_x,
        y_max: max_y,
      },
      {
        headers: {
          "Content-Profile": "atlas_api",
          "Accept-Profile": "atlas_api",
        },
      }
    );
    let maxS = 0;
    resp.data.map((m: any) => {
      maxS = Math.max(m.count_obs, maxS);
    });
    let pal: any = ["case"];
    resp.data.map((m: any) => {
      pal.push(["==", ["get", "fid"], m.fid]);
      pal.push(get_col(Math.sqrt(m.count_obs / maxS)));
    });
    pal.push("white");
    return pal;
  };

  useEffect(() => {
    let ignore = true;
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    return () => {
      maplibregl.removeProtocol("pmtiles");
      ignore = false;
    };
  }, []);

  const onMapLoad = useCallback(() => {
    let ignore = false;
    mapRef.current.on("click", "atlas", (e: any) => {
      const features: any = mapRef?.current.queryRenderedFeatures(e.point);
      setClickCoor([e.lngLat.lng, e.lngLat.lat]);
      setPopupText(
        `<strong>Espèce</strong>: ${features[0].properties.valid_scientific_name}<br><strong>Jeu de données</strong>: ${features[0].properties.dataset_name}`
      );
      setShowPopup(true);
    });

    let proceed = true;
    mapRef.current.on("zoom", (e: any) => {
      setZoom(e.target.getZoom());
      if (proceed) {
        const bounds = e.target.getBounds();
        proceed = false;
        setTimeout(
          () => {
            getObs(
              zoom_scale(zoom),
              bounds.getWest(),
              bounds.getSouth(),
              bounds.getEast(),
              bounds.getNorth(),
              "count_obs"
            ).then((pal: any) => {
              if (!ignore) {
                setOutline("#ffffffaa");
                setPal(pal);
                proceed = true;
              }
            });
          },
          500,
          zoom
        );
      }
    });

    return () => {
      maplibregl.removeProtocol("pmtiles");
      ignore = true;
    };
  }, [mapRef]);

  return (
    <div className="App">
      <Map
        ref={mapRef}
        style={{ width: "100vw", height: "100vh" }}
        initialViewState={{
          longitude: -70,
          latitude: 55,
          zoom: 4,
        }}
        mapStyle={{
          version: 8,
          sources: {
            atlas: {
              type: "vector",
              url: "pmtiles://https://object-arbutus.cloud.computecanada.ca/bq-io/atlas-pmtiles/atlas_hex102050.pmtiles",
            },
            background: {
              type: "raster",
              tiles: [
                "https://01.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "carto-dark",
              source: "background",
              type: "raster",
              minzoom: 0,
              maxzoom: 22,
            },
            {
              id: "atlas",
              source: "atlas",
              "source-layer": "hex20",
              type: "fill",
              paint: {
                "fill-color": pal,
                "fill-opacity": 0.5,
                "fill-outline-color": "#ffffffaa",
              },
            },
            {
              id: "atlas2",
              source: "atlas",
              "source-layer": "hex10",
              type: "fill",
              paint: {
                "fill-color": "#fff",
                "fill-opacity": 0.2,
              },
            },
            {
              id: "atlas3",
              source: "atlas",
              "source-layer": "hex50",
              type: "fill",
              paint: {
                "fill-color": pal,
                "fill-opacity": 0.5,
                "fill-outline-color": outline,
              },
            },
          ],
        }}
        onLoad={onMapLoad}
        mapLib={maplibregl}
      >
        {showPopup && (
          <Popup
            ref={popupRef}
            latitude={clickCoor[1]}
            longitude={clickCoor[0]}
            style={{ zIndex: 999 }}
            closeOnClick={false}
            closeButton={false}
          >
            <div dangerouslySetInnerHTML={{ __html: popupText }}></div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
