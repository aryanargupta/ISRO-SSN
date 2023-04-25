const { pool } = require("./config/pgConnect");

module.exports.queries = {
  getWeatherData: (res) => {
    const sql = `
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature)
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'id', id,
                'geometry', ST_AsGeoJSON(lat_lon)::jsonb,
                'properties', to_jsonb(weather_data) - 'id' - 'lat_lon'
            ) AS feature
            FROM weather_data
            ) AS features;`;

    pool.query(sql, (err, ress) => {
      if (err) {
        console.log("ERROR WHILE POOLING: ", err);
        return err;
      } else {
        res.send(ress.rows[0].jsonb_build_object);
      }
    });
  },

  getBathymetryPolygons: (res) => {
    // query that groups similar elevation features and creates a polygon
    // const sql = `
    // SELECT jsonb_build_object(
    //     'type', 'FeatureCollection',
    //     'features', jsonb_agg(feature)
    // )
    // FROM (
    // SELECT jsonb_build_object(
    //       'type', 'Feature',
    //       'geometry', ST_AsGeoJSON(ST_Buffer(lat_lon, 1))::jsonb,
    //       'properties', jsonb_build_object(
    //           'elevation', elevation
    //       )
    //   ) AS feature
    //   FROM weather_data
    // ) AS features;
    // `;

    const sql = `
    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(feature)
    )
    FROM (
    SELECT jsonb_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(ST_Buffer(lat_lon, 0.6))::jsonb,
          'properties', jsonb_build_object(
              'elevation', elevation
          )
      ) AS feature
      FROM weather_data
    ) AS features;
    `;

    const sql2 = `
        SELECT
      jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(feature)
      ) AS geojson
    FROM (
      SELECT
        jsonb_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(ST_ConvexHull(ST_Collect(ST_MakeEnvelope(ST_X(lat_lon), ST_Y(lat_lon), ST_X(lat_lon)+0.8, ST_Y(lat_lon)+0.8))))::jsonb,
          'properties', jsonb_build_object(
            'elevation', AVG(elevation)
          )
        ) AS feature
      FROM weather_data
      GROUP BY ST_SnapToGrid(lat_lon, 0.8, 0.8)
    ) AS features;
    `;

    const sql3 = `
    SELECT
      jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(feature)
      ) AS geojson
    FROM (
      SELECT
        jsonb_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(ST_ConvexHull(ST_Collect(ST_MakeEnvelope(ST_X(lat_lon), ST_Y(lat_lon), ST_X(lat_lon)+0.001, ST_Y(lat_lon)+0.001)))),
          'properties', jsonb_build_object(
            'elevation', AVG(elevation)
          )
        ) AS feature
      FROM
        weather_data
      GROUP BY
        ST_Tile(lat_lon, 1,1)
    ) AS features;
    `;
    pool.query(sql2, (err, ress) => {
      if (err) {
        console.log("ERROR WHILE POOLING: ", err);
        return err;
      } else {
        res.send(ress.rows[0].geojson);
      }
    });
  },
};
