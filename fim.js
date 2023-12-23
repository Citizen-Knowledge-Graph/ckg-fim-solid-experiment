const semver = require("semver");
const fs = require("fs");
const fsp = require("fs").promises;

const DIR = ".fim";
const SCHEMAS_1_FILE = DIR + "/schemas1.json";
const SCHEMAS_2_FILE = DIR + "/schemas2.json";
const JSON_SCHEMA_FILES_DIR = DIR + "/json-schema-files";
const DATA_FIELDS_CONSTRAINTS_FILE = DIR + "/data-fields-constraints.json";

function expandVersionStr(versionStr) {
    return versionStr.split(".").length < 3 ? versionStr + ".0" : versionStr;
}

async function fetchAllSchemas() {
    // ?offset=0&limit=10&show_all=false
    // ?show_all=true
    const response = await fetch("https://test.schema-repository.fitko.dev/api/v0/schemas?show_all=true");
    const json = await response.json();
    const map = {}; // id to latest version
    for (let schema of json.items) {
        const id = schema.fim_id;
        let version = schema.fim_version;
        if (map.hasOwnProperty(id)) {
            // store only the lastest FIM version
            if (semver.gt(expandVersionStr(version), expandVersionStr(map[id]))) {
                map[id] = version;
            }
        } else {
            map[id] = version;
        }
    }
    await fs.mkdir(DIR, () => {});
    fs.writeFile(SCHEMAS_1_FILE, JSON.stringify(map, null, 2), "utf8", () => {});
}

async function extractJsonFromSchemas() {
    const map = {}; // id to latest version and JSON path
    fs.readFile(SCHEMAS_1_FILE, "utf8", async (err, data) => {
        let entries = Object.entries(JSON.parse(data));
        let count = 0;
        for (const [id, version] of entries) {
            const response = await fetch(`https://test.schema-repository.fitko.dev/api/v0/schemas/${id}/${version}`);
            const json = await response.json();
            console.log(`${++ count} / ${entries.length}, ${id}, ${version}`);
            let jsonSchemaFilesNode = [];
            if (json.hasOwnProperty("json_schema_files")) {
                jsonSchemaFilesNode = json.json_schema_files;
                if (json.json_schema_files.length > 1) {
                    // this didn't happen though
                    console.log("--> ", json.json_schema_files.length);
                }
            }
            map[id] = {
                version: version,
                json_files: jsonSchemaFilesNode,
            };
        }
        fs.writeFile(SCHEMAS_2_FILE, JSON.stringify(map, null, 2), "utf8", () => {});
    });
}

async function downloadJsonSchemaFiles() {
    await fs.mkdir(JSON_SCHEMA_FILES_DIR, { recursive: true }, () => {});
    fs.readFile(SCHEMAS_2_FILE, "utf8", async (err, data) => {
        let entries = Object.entries(JSON.parse(data));
        let count = 0;
        for (const [schemaId, entry] of entries) {
            if (entry.json_files.length === 0) continue;
            const jsonSchemaFilename = entry.json_files[0].filename;
            const response = await fetch(`https://test.schema-repository.fitko.dev/immutable/json-schema/${jsonSchemaFilename}`);
            const json = await response.json();
            console.log(`${++count} / ${entries.length}, ${schemaId}, ${jsonSchemaFilename}`);
            fs.writeFile(`${JSON_SCHEMA_FILES_DIR}/${schemaId}.json`, JSON.stringify(json, null, 2), "utf8", () => {});
        }
    });
}

async function collectDataFieldConstraintsFromJsonSchemaFiles() {
    const files = await fsp.readdir(JSON_SCHEMA_FILES_DIR);
    let map = {}; // data field Id to version and constraints
    let readOps = files.map(async (file, index) => {
        // if (index > 0) return;
        // console.log(`${index + 1} / ${files.length}, ${file}`);
        const data = await fsp.readFile(`${JSON_SCHEMA_FILES_DIR}/${file}`, "utf8");
        const json = JSON.parse(data);
        let dataFields = Object.keys(json.$defs).filter(key => key.startsWith("F"));
        for (let dataField of dataFields) {
            let id = dataField.split("V")[0];
            let version = dataField.split("V")[1];
            if (!map.hasOwnProperty(id) || semver.gt(expandVersionStr(version), expandVersionStr(map[id].version))) {
                // we should also check if the constraints vary between schemas, but for now we just take the first that shows up for a data field and the latest version of that
                map[id] = {
                    version: version,
                    constraints: json.$defs[dataField],
                };
            }
        }
    });
    await Promise.all(readOps);
    fs.writeFile(DATA_FIELDS_CONSTRAINTS_FILE, JSON.stringify(map, null, 2), "utf8", () => {});
}

function convertSelectedDataFieldsConstraintsToShaclShapes() {
    // TODO
}

// fetchAllSchemas().then(() => {});
// extractJsonFromSchemas().then(() => {});
// downloadJsonSchemaFiles().then(() => {});
// collectDataFieldConstraintsFromJsonSchemaFiles().then(() => {});
convertSelectedDataFieldsConstraintsToShaclShapes().then(() => {});