import { IonCheckbox, IonContent, IonModal, IonSearchbar } from "@ionic/react";
import { Coordinate, toStringXY } from "ol/coordinate";
import { useContext, useRef } from "react";
import { MapContext } from "../../store/MapContext";
// import { selectedPoints } from '../../components/Map/Map';
import { selectedPointsArray } from "../../components/Map/Map";

const SettingsSheet = () => {
  const modal = useRef<HTMLIonModalElement>(null);

  const getYX = (coord: Coordinate) => {
    const arr = toStringXY(coord, 4).split(", ");
    const lat = parseFloat(arr[1]);
    const lon = parseFloat(arr[0]);
    return `${Math.abs(lat)} ${lat < 0 ? "S" : "N"}, ${Math.abs(lon)} ${
      lon < 0 ? "W" : "E"
    }`;
  };

  const {
    selectedCoord,
    handlePathGenerator,
    handleSearch,
    layerLoading,
    setDestination,
    setShowBathymetry,
    setShowWind,
    setSource,
    showBathymetry,
    showWind,
    handleRemoveCurrentRoute,
  } = useContext(MapContext);

  return (
    <IonModal
      ref={modal}
      trigger="open-settings-sheet"
      initialBreakpoint={0.25}
      breakpoints={[0, 0.25, 0.5, 0.75, 1]}
    >
      <IonContent className="ion-padding">
        <IonSearchbar
          onClick={() => modal.current?.setCurrentBreakpoint(0.75)}
          placeholder="Search"
        ></IonSearchbar>
        <div className="bottom-container">
          {selectedCoord && (
            <>
              <div className="cord-container">
                <span className="inline-title">Coordinate</span>
                <span className="text">
                  {selectedCoord ? getYX(selectedCoord) : ""}
                </span>
              </div>
              <div className="divider" />
            </>
          )}
          <div className="divider" />
          <div className="subcontainer">
            <p className="title">Get regional data</p>
            <input
              type="text"
              placeholder="Soruce Coordinates"
              onChange={(e) => setSource(e.target.value)}
              className="input"
              disabled={layerLoading}
            />
            <input
              type="text"
              placeholder="Destination Coordinates"
              onChange={(e) => setDestination(e.target.value)}
              className="input"
              disabled={layerLoading}
            />
            <button
              onClick={handleSearch}
              className="button"
              disabled={layerLoading}
            >
              Get Circle
            </button>
          </div>
          <div className="divider" />
          <div className="subcontainer">
            <p className="title">Get Route</p>
            <input
              type="text"
              placeholder="Source Coordinates"
              onChange={() => {
                // e.target.value=selectedPointsArray[0].join(', ');
                // console.log(e.target.value);
                // setSource(e.target.value);
                // console.log(selectedPoints);
                setSource(selectedPointsArray[0].join(', '));
                // console.log(source);
              }}
              className="input"
              disabled={layerLoading}
            />
            <input
              type="text"
              placeholder="Destination Coordinates"
              onChange={() => {
                // e.target.value=selectedPointsArray[0].join(', ');
                // setDestination(e.target.value);
                // console.log(selectedPoints);
                setDestination(selectedPointsArray[1].join(', '));
              }}
              className="input"
              disabled={layerLoading}
            />
            <div className="router__buttons__wrapper">
              <button
                onClick={handlePathGenerator}
                className="button"
                disabled={layerLoading}
              >
                Get Route
              </button>
              <button
                onClick={handleRemoveCurrentRoute}
                className="button"
                disabled={layerLoading}
              >
                Remove Current Route
              </button>
            </div>
          </div>
          <div className="divider" />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SettingsSheet;
