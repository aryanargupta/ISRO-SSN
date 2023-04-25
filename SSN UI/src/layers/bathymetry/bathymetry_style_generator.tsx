import { Style, Fill } from "ol/style";
import { FeatureLike } from "ol/Feature";

interface IProps {
  feature: FeatureLike;
}

const generateBathymetryStyles = ({ feature }: IProps) => {
  var elevation = feature.get("elevation");
  // generate blue color shades according to the given sea elevation
  var color;
  if (elevation > -4500) {
    color = `rgba(255, 255, 255, 0)`;
  } else if (elevation > -4600) {
    color = `rgb(98, 205, 255)`;
  } else if (elevation > -4700) {
    color = `rgb(28, 130, 173)`;
  } else if (elevation > -4800) {
    color = `rgb(0, 51, 124)`;
  } else {
    color = `rgb(19, 0, 90)`;
  }

  // const color = `rgba(0, 0, ${Math.round((elevation / 10000) * 255)}, 0.9)`;
  const bathymetryStyles = new Style({
    fill: new Fill({
      color: color,
    }),
  });

  return bathymetryStyles;
};

export default generateBathymetryStyles;
