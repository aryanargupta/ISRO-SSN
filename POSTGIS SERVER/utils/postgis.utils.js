const fs = require("fs");
const csv = require("csv-parser");
// NETCDF DOESNT WORK WELL

// const { NetCDFReader } = require("netcdfjs");

// module.exports.readFromFileAndDumpTemp = (fileName) => {
//   const file = fs.readFileSync(fileName);
//   const reader = new NetCDFReader(file);

//   const data = reader.getDataVariable("lat");
//   const data2 = reader.getDataVariable("lon");
//   const data3 = reader.getDataVariable("elevation");

//   console.log("DATA: ", data.length);
//   console.log("DATA2: ", data2.length);
//   console.log("DATA3: ", data3.length);

// };

module.exports.readFileAndDump = (fileName, pool) => {
  // TODO -> HANDLE TIME INPUTS IN BOTH READ AND DUMP AND CREATE
  var arr = [];

  fs.createReadStream(fileName)
    .pipe(csv())
    .on("data", (row) => {
      // Convert the row object to an array of values
      const values = Object.values(row);

      const sql = `
              INSERT INTO weather_data (uwnd, vwnd, dir, hs, t0m1, phs01, phs02, pdi01, pdi02, elevation, lat_lon)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326))
            `;

      const toPut = {
        uwnd: values[1],
        vwnd: values[2],
        dir: values[5],
        hs: values[3],
        t0m1: values[4],
        phs01: values[6],
        phs02: values[7],
        pdi01: values[8],
        pdi02: values[9],
        elevation: values[10],
        lat_lon: `ST_SetSRID(ST_MakePoint(${values[11]}, ${values[12]}), 4326)`,
      };
      arr.push(toPut);
      // Execute the SQL statement with the values from the CSV row
      // pool.query(
      //   sql,
      //   [
      //     values[1],
      //     values[2],
      //     values[5],
      //     values[3],
      //     values[4],
      //     values[6],
      //     values[7],
      //     values[8],
      //     values[9],
      //     values[10],
      //     values[11],
      //     values[12],
      //   ],
      //   (err, res) => {
      //     if (err) {
      //       console.error(err);
      //     } else {
      //       console.log(`Inserted row successfully`);
      //     }
      //   }
      // );
    })
    .on("end", () => {
      console.log("CSV file successfully processed");
      console.log("ARR: ", arr.length, arr[0]);
      const sqlToRun = `
              INSERT INTO weather_data (uwnd, vwnd, dir, hs, t0m1, phs01, phs02, pdi01, pdi02, elevation, lat_lon)
              VALUES ${arr.map(
                (item) =>
                  `(${item.uwnd}, ${item.vwnd}, ${item.dir}, ${item.hs}, ${item.t0m1}, ${item.phs01}, ${item.phs02}, ${item.pdi01}, ${item.pdi02}, ${item.elevation}, ${item.lat_lon})`
              )}
            `;
      pool.query(sqlToRun, (err, res) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`Inserted row successfully`);
        }
      });

      pool.end();
    });
};

module.exports.createTableWithName = (tableName, pool) => {
  // TODO -> MAKE IT DYNAMIC IN NATURE
  const sql = `
      CREATE TABLE ${tableName} (
          id SERIAL PRIMARY KEY,
          uwnd FLOAT,
          vwnd FLOAT,
          dir FLOAT,
          hs FLOAT,
          t0m1 FLOAT,
          phs01 FLOAT,
          phs02 FLOAT,
          pdi01 FLOAT,
          pdi02 FLOAT,
          elevation FLOAT,
          lat_lon GEOMETRY(Point, 4326)
      );
      `;
  pool.query(sql, (err, res) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Table created`);
    }
  });
};

//   // create table query for wind_data in sql
