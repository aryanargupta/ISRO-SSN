import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import axiosInstance from "../services/axiosInstance";
import LineString from "ol/geom/LineString";

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
  const points = res.data;

  // Create an array of coordinates
  const coordinates = points.map((point: number[]) =>
    fromLonLat([point[1], point[0]])
  );

  // Apply smoothing by averaging neighboring coordinates
  const smoothedCoordinates = [];
  const smoothingFactor = 0.5; // Adjust this value to control the smoothing level

  for (let i = 0; i < coordinates.length; i++) {
    if (i === 0 || i === coordinates.length - 1) {
      smoothedCoordinates.push(coordinates[i]);
    } else {
      const smoothedX = (1 - smoothingFactor) * coordinates[i][0] +
        smoothingFactor * (coordinates[i - 1][0] + coordinates[i + 1][0]) / 2;
      const smoothedY = (1 - smoothingFactor) * coordinates[i][1] +
        smoothingFactor * (coordinates[i - 1][1] + coordinates[i + 1][1]) / 2;
      smoothedCoordinates.push([smoothedX, smoothedY]);
    }
  }

  // Create a LineString geometry from the smoothed coordinates
  const lineString = new LineString(smoothedCoordinates);

  // Create a feature with the LineString geometry
  const lineFeature = new Feature({
    geometry: lineString,
    name: "Line",
  });

  // Create a vector source and add the feature
  const lineVectorSource = new VectorSource({
    features: [lineFeature],
    wrapX: false,
  });

  // Create a style for the line
  const lineStyle = new Style({
    stroke: new Stroke({
      color: "red",
      width: 2,
    }),
  });

  // Create a vector layer with the vector source and style
  const lineVectorLayer = new VectorLayer({
    source: lineVectorSource,
    style: lineStyle,
  });

  lineVectorLayer.set("name", "lineLayer");
  // Add the line vector layer to the map
  map.addLayer(lineVectorLayer);

  setLoading(false);
};
