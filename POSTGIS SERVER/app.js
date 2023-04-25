require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool } = require("./config/pgConnect");
const { queries } = require("./queries");
const {
  readFileAndDump,
  createTableWithName,
} = require("./utils/postgis.utils");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Welcome to the POST GIS Server");
});

app.get("/get-isro", (req, res) => {
  queries
    .getPostGisData()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Connected to the database ✨");
});

app.get("/load-data", (req, res) => {
  // TODO -> ONLY SUPPORTING WEATHER FEATURE
  readFileAndDump(
    "C:\\Users\\ddave\\OneDrive\\Desktop\\ISRO SSN\\ISRO PostGIS Backend\\weather.csv",
    pool
  );
  res.send("Loaded successfully 😀");
});

app.get("/create-table", (req, res) => {
  createTableWithName("weather_data", pool);
  res.send("Table Created Successfully 😀");
});

app.get("/get-weather-data", (req, res) => {
  queries.getWeatherData(res);
});

app.get("/get-bathymetry-polygons", (req, res) => {
  queries.getBathymetryPolygons(res);
});
app.listen(8000, () => {
  console.log("Server is running on port 8000 🎉");
});
