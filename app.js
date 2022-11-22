const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const dbConnection = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
};
dbConnection();
const snaketoCamel = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};
app.get("/states/", async (request, response) => {
  const getQuery = `
        SELECT * 
        FROM state;`;
  const res = await db.all(getQuery);
  let result = [];
  for (let i = 0; i < res.length; i++) {
    result.push(snaketoCamel(res[i]));
  }
  console.log(result);
  response.send(result);
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
        SELECT * 
        FROM state 
        WHERE state_id = ${stateId};`;
  const res = await db.get(getQuery);
  response.send(snaketoCamel(res));
});
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths});`;
  const res = await db.run(postQuery);
  console.log(res.lastID);
  response.send("District Successfully Added");
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
        SELECT district_id as districtId, district_name as districtName, state_id as stateId, cases, cured, active, deaths
        FROM district
        WHERE district_id= ${districtId};`;
  const res = await db.get(getQuery);
  response.send(res);
});
app.get("/districts/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
        SELECT *
        FROM district;`;
  const res = await db.all(getQuery);
  response.send(res);
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const putQuery = `
        update district
        set
            district_name = "${districtName}",
            state_id = ${stateId},
            cases = ${cases},
            cured=  ${cured},
            active = ${active},
            deaths = ${deaths}
        where district_id = ${districtId};`;
  const res = await db.run(putQuery);
  response.send("District Details Updated");
});
//statistics based on stateID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
    select totalCases, totalCured, totalActive, totalDeaths 
    from (select state.state_id as stateId, count(district.cases) as totalCases, count(district.cured) as totalCured,
    count(district.active) as totalActive, count(district.deaths) as totalDeaths
    from state left join district
    on state.state_id = district.state_id
    group by stateId)
    where stateId = ${stateId};`;
  const res = await db.get(getQuery);
  response.send(res);
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
        select state.state_name as stateName from state inner join district
        on state.state_id = district.state_id
        and district.district_id = ${districtId};`;
  const res = await db.get(getQuery);
  response.send(res);
});
app.listen(3000);
module.exports = app;
