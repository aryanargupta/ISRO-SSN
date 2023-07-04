// import React, { memo, useContext } from "react";
// import "./Map.css";
// import Loader from "../Loader/loader.component";
// import { MapContext } from "../../store/MapContext";
// interface MapProps {
//   children?: React.ReactNode;
//   center?: any;
//   zoom?: number;
//   refresh?: number;
//   features?: any;
// }

// const Map = ({ children, center, zoom, refresh, features }: MapProps) => {
//   const { mapElement, layerLoading } = useContext(MapContext);

//   return (
//     <div style={{ overflowY: layerLoading ? "clip" : "auto" }}>
//       {layerLoading && <Loader />}
//       <div
//         ref={mapElement as React.MutableRefObject<HTMLDivElement>}
//         className="ol-map"
//         style={{ width: window.innerWidth, height: window.innerHeight }}
//       />
//     </div>
//   );
// };

// export default memo(Map);

import React, { memo, useContext, useEffect, useState } from "react";
import "./Map.css";
import Loader from "../Loader/loader.component";
import { MapContext } from "../../store/MapContext";

interface MapProps {
  children?: React.ReactNode;
  center?: any;
  zoom?: number;
  refresh?: number;
  features?: any;
  // selectedPoints?: any;
  // index?: any; 
  // point?: any;
}

const selectedPointsArray: any[] = [];
const Map = ({ children, center, zoom, refresh, features }: MapProps) => {
  // use the mapElement from the MapContext
  const { mapElement, layerLoading, getClickedPixelCoordinates } = useContext(MapContext);
  const [selectedPoints] = useState<any[]>(selectedPointsArray);

  const isPointSelected = (point: any) => {
    return selectedPoints.some((p) => p[0] === point[0] && p[1] === point[1]);
  };


  // add the useEffect hook here
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const map = mapElement.current;

      if (map) {
        const rect = map.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const coordinates = getClickedPixelCoordinates([x, y]);


        const point = { x: (coordinates as unknown as number[])[0], y: (coordinates as unknown as number[])[1] }; // Use type assertion to cast coordinates to number[]
        const pointsArray = [point.x, point.y]; // Create an array of two numbers from the object
        // console.log("Points Array:", pointsArray[0], pointsArray[1]);

        // console.log(selectedPoints.length);
        if (selectedPoints.length < 2 && !isPointSelected(coordinates)) {
          selectedPoints.push(coordinates);

          console.log("Coordinates inserted")
          // console.log(coordinates[0])

        } else if (selectedPoints.length === 2) { // Add an else if condition to check if the selectedPoints length is 2
          selectedPoints.splice(0); // Use splice method to empty the array
          console.log("Coordinates Removed")
        }
        // console.log(selectedPoints);
        
      }
      
    };
    


    const map = mapElement.current;
    if (map) {
      map.addEventListener("click", handleClick);
    }

    return () => {
      if (map) {
        map.removeEventListener("click", handleClick);
      }
    };
  }, [mapElement]);



  return (
    <div style={{ overflowY: layerLoading ? "clip" : "auto" }}>
      {layerLoading && <Loader />}
      <div
        ref={mapElement as React.MutableRefObject<HTMLDivElement>}
        className="ol-map"
        style={{ width: window.innerWidth, height: window.innerHeight }}
      />
    </div>
  );
};

// export const SelectedPointsComponent: React.FC<SelectedPointsComponentProps> = (props) => {
//   const { selectedPoints } = useContext(MapContext);

//   return (
//     <div>
//       {/* Use the selectedPoints array here */}
//       {selectedPoints.map((point, index) => (
//         <div key={index}>
//           Point {index + 1}: {point[0]}, {point[1]}
//         </div>
//       ))}
//     </div>
//   );
// };
export { selectedPointsArray };
export default memo(Map);
