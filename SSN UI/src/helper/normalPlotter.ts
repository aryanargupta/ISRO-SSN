import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import axiosInstance from "../services/axiosInstance";

export const plotPointsIndividually = async (
  source: string,
  destination: string,
  map: any,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoading(true);
  const SRC_COORDINATES = source.split(", ");
  
  const DEST_COORDINATES = destination.split(", ");
  
  const res = await axiosInstance.post("http://localhost:8080/stream-path", {
    source_coords: [parseInt(SRC_COORDINATES[0]), parseInt(SRC_COORDINATES[1])],
    destination_coords: [
      parseInt(DEST_COORDINATES[0]),
      parseInt(DEST_COORDINATES[1]),
    ],
    gtype: "full",
    ntype: 1,
  });
  const points = res.data.args;
  console.log('src'+typeof SRC_COORDINATES);
  console.log('dest'+DEST_COORDINATES);
  
  // console.log(source);
  // console.log(destination);
  console.log('points: '+points);
  console.log(res.data.args);
  points.forEach((point: number[]) => {
    const pointFeature = new Feature({
      geometry: new Point(fromLonLat([point[1], point[0]])),
      name: "Point",
    });
    const pointVectorSource = new VectorSource({
      features: [pointFeature],
      wrapX: false,
    });
    const pointVectorLayer = new VectorLayer({
      source: pointVectorSource,
      style: new Style({
        image: new CircleStyle({
          radius: 4,
          fill: new Fill({ color: "red" }),
          stroke: new Stroke({ color: "black", width: 1 }),
        }),
      }),
    });
    // how to name this layer
    pointVectorLayer.set("name", "pointLayer");
    map.addLayer(pointVectorLayer);
    setLoading(false);
  });
};