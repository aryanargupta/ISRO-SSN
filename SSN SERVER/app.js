require("dotenv").config();
const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const dataTemp = require("./sample.json");
const PORT = process.env.PORT || 8080;
const bspline = require("b-spline");
const { Console } = require("console");
const { PythonShell } = require("python-shell");

app.use(cors());

// parse data
//can set a limit over the request msg size
//can serve similar requests, by maintaining a cache
// (express.json)parses the body from post/fetch request
// (express.urlencoded) deals with forms data
app.use(express.json());
app.use(express.urlencoded({ extended: false })); //false or true

app.get("/", (req, res) => {
  res.send("WELCOME TO SSN DATA STREAMER");
  console.log(`${req.body}`);
});

// create an api that streams the data in chunks using fs
app.get("/stream-data", (req, res) => {
  const filePath = "./sample.json";
  const stream = fs.createReadStream(filePath);
  //assumption is i wont have the old data, so updated data is sent without checking time var in the data sent.

  stream.on("end", function () {
    res.end();
  });
  stream.pipe(res);
  // pipeline(
  //   createReadStream('./sample.json'),
  //   parse(),
  //   transform
  // )
});

// // check the length of array in json file
// app.get("/check-length", (req, res) => {
//   const stream = fs.createReadStream("./data/pdreversedata.json");
//   var points = [];
//   stream.on("data", (chunk) => {
//     points.push(chunk);
//   });
//   stream.on("end", () => {
//     // console.log("DATA: ", points);
//     // console.log("SSSSSS: ", ss.charAt(65536));
//     const pointts = JSON.parse(points);
//     console.log(pointts.features.length);
//     res.send(pointts.features.length);
//     res.end();
//   });
// });

app.post("/stream-path", (req, res) => {
  let options = {
    mode: "text",
    pythonOptions: ["-u"],
    scriptPath: "./shipnav/",

    args: [
      req.body.source_coords,
      req.body.destination_coords,
      req.body.gtype,
      req.body.ntype,
    ],
  };

  console.log("source: ", req.body.source_coords);
  console.log("destination: ", req.body.destination_coords);

  PythonShell.run("Graph_search.py", options, function (err, result) {
    if (err) res.send(err); // result is an array consisting of messages collected.
    string = result[0];
    console.log(result);
    ans = string.slice(2, -2).split("), (");
    var result = ans.map(function (currentObject) {
      return currentObject.split(", ").map(Number);
    });
    res.send(result);
    res.end();
  });
});

app.post("/get-circle", async (req, res) => {
  /*
  for req.body
  {
    "source_coords": [10, 16],
    "destination_coords": [20, 30]
  }
  response is
  CENTER:  [ 15, 23 ]
  RADIUS:  8.602325267042627
  */
  //commented initial parsing method, as destructured assignment was giving undefined as datatype
  // const coordinate1 = Object.values (req.body)[0];
  // const coordinate2 = Object.values (req.body)[1];
  const { input1, input2 } = req.body;
  console.log(input1, input2); //undefined response
  const coordinate1 = input1.split(", ");
  const coordinate2 = input2.split(", ");
  // find distance between coordinate 1 and coordinate 2
  const diameter = Math.sqrt(
    Math.pow(parseInt(coordinate1[0]) - parseInt(coordinate2[0]), 2) +
      Math.pow(parseInt(coordinate1[1]) - parseInt(coordinate2[1]), 2)
  );
  // find center of these two coordinates given
  const center = [
    (parseInt(coordinate1[0]) + parseInt(coordinate2[0])) / 2,
    (parseInt(coordinate1[1]) + parseInt(coordinate2[1])) / 2,
  ];
  // find radius of circle
  const radius = diameter / 2;
  console.log("CENTER: ", center);
  console.log("RADIUS: ", radius);

  // find all the points in the pddata which lie inside this circle
  // const stream = fs.createReadStream ('./data/newTempData.json');
  // var points = [];
  // stream.on ('data', chunk => {
  //   points.push (chunk);
  // });
  // stream.on ('end', () => {
  //   // console.log("DATA: ", points);
  //   // console.log("SSSSSS: ", ss.charAt(65536));
  //   const pointts = JSON.parse(points);
  //   const filteredPoints = pointts.features.filter (feature => {
  //     const x = feature.geometry.coordinates[1];
  //     const y = feature.geometry.coordinates[0];
  //     // var temp = feature.geometry.coordinates[0]
  //     // feature.geometry.coordinates[0] = feature.geometry.coordinates[1]
  //     // feature.geometry.coordinates[1] = temp

  //     return (
  //       Math.sqrt (Math.pow (x - center[0], 2) + Math.pow (y - center[1], 2)) <
  //       radius
  //     );
  //   });
  const data = JSON.parse(JSON.stringify(dataTemp));
  //console.log(data)
  const filteredPoints = data.features.filter((feature) => {
    const x = feature.geometry.coordinates[0]; //reversed index here
    const y = feature.geometry.coordinates[1];
    // var temp = feature.geometry.coordinates[0]
    // feature.geometry.coordinates[0] = feature.geometry.coordinates[1]
    // feature.geometry.coordinates[1] = temp
    return (
      Math.sqrt(Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2)) <
      radius
    );
  });
  console.log(filteredPoints);
  const geoJSONData = {
    features: filteredPoints,
    type: "FeatureCollection",
  };

  res.status(200).send(geoJSONData);
  // });
});

app.get("/sea-data", (req, res) => {
  // read a file and filter it through time and send it in chunks
  const stream = fs.createReadStream("./data/bathymetryPolygon.json");

  stream.on("error", function () {
    res.status(404).end();
  });
  stream.on("end", function () {
    res.end();
  });
  stream.pipe(res);
});

// API TO TAKE POINTS FROM THE FRONTEND OF THE SOURCE AND THE DESTINATION AND THEN INTERPOLATING A PATH BETWEEN IN RANDOMLY AND THEN CREATING A BSPLINE OUT OF IT AND SENDING THOSE POINTS BACK TO THE FRONTEND
app.post("/get-points", (req, res) => {
  const data = JSON.parse(JSON.stringify(dataTemp));
  const { input1, input2 } = req.body;
  const coordinate1 = input1.split(", ");
  const coordinate2 = input2.split(", ");

  const x1 = parseInt(coordinate1[0]);
  const y1 = parseInt(coordinate1[1]);
  const x2 = parseInt(coordinate2[0]);
  const y2 = parseInt(coordinate2[1]);

  // get a straight line between these two points from the data
  // TODO -> ACTUALLY GET A STRAIGHT LINE FROM THE GRAPH ALGORITHM USING THE DATA PROVIDED
  let path = [];

  for (let i = 0; i < data.features.length; i++) {
    const x = data.features[i].geometry.coordinates[1];
    const y = data.features[i].geometry.coordinates[0];

    if (
      x >= Math.min(x1, x2) &&
      x <= Math.max(x1, x2) &&
      y >= Math.min(y1, y2) &&
      y <= Math.max(y1, y2)
    ) {
      path.push([y, x]);
    }
  }

  res.status(200).send(path);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
