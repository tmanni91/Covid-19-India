const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject1 = (dbObject1) => {
  return {
    districtId: dbObject1.district_id,
    districtName: dbObject1.district_name,
    stateId: dbObject1.state_id,
    cases: dbObject1.cases,
    cured: dbObject1.cured,
    active: dbObject1.active,
    deaths: dbObject1.deaths,
  };
};

// API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

// API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
      * 
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

// API Extra

app.get("/districts/", async (request, response) => {
  const getDistrictsQuery = `
    SELECT
      *
    FROM
      district;`;
  const districtsArray = await database.all(getDistrictsQuery);
  response.send(
    districtsArray.map((eachDist) => convertDbObjectToResponseObject1(eachDist))
  );
});

// API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postPlayerQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const player = await database.run(postPlayerQuery);
  response.send("District Successfully Added");
});

// API 4

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let getQuery = `
  SELECT * 
  FROM district
  WHERE district_id = '${districtId}'  `;
  const dbResult = await database.get(getQuery);
  const result = convertDbObjectToResponseObject1(dbResult);
  response.send(result);
  console.log(result);
});

// API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistQuery);
  response.send("District Removed");
});

// API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district.district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
      SUM(district.cases) AS sum_cases,
      SUM(district.cured) AS sum_cured,
      SUM(district.active) AS sum_active,
      SUM(district.deaths) AS sum_deaths
    FROM 
      district INNER JOIN state ON district.state_id = state.state_id
    WHERE 
      district.state_id = ${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["sum_cases"],
    totalCured: stats["sum_cured"],
    totalActive: stats["sum_active"],
    totalDeaths: stats["sum_deaths"],
  });
});

// API 8

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId, stateId } = request.params;
  const getDistrictDetailsQuery = `
    SELECT 
      state.state_name AS stateName 
    FROM 
      state INNER JOIN district ON state.state_id = district.state_id 
    WHERE 
      district.district_id = ${districtId};`;
  const details = await database.get(getDistrictDetailsQuery);
  //   console.log(details);
  response.send(details);
});

module.exports = app;
