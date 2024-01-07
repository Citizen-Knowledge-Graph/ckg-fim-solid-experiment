import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { promises as fsPromise } from "fs";
import fromFile from "rdf-utils-fs/fromFile.js";
import rdf from "rdf-ext";
import rdfDataModel from "@rdfjs/data-model";
import Validator from "shacl-engine/Validator.js";
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { QueryEngine as QueryEngineFile } from "@comunica/query-sparql-file";

const DB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db");
const SHACL_DIR = `${DB_DIR}/shacl`;
const INFERENCE_FILE = `${DB_DIR}/inference.ttl`;

export async function validateAll(userProfileDataset, useInference, callback) {
    if (useInference) {
        // Or use a reasoner instead of doing it manually? TODO
        await(materialiseInferenceInMemory(userProfileDataset));
    }

    let summary = {
        valid: {
            label: "Eligible",
            arr: []
        },
        invalid: {
            label: "Not eligible",
            arr: []
        },
        missingData: {
            label: "Missing data",
            arr: []
        },
    };

    fs.readdir(SHACL_DIR, async (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const shaclFile of files) {
            let path = `${SHACL_DIR}/${shaclFile}`;
            // extract title via SPARQL or via dataset.match(null, rdf.namedNode("http://ckg.de/default#title"), null) TODO
            const title = await extractTitleFromShaclFile(path);
            const dataset = await rdf.dataset().import(fromFile(path));
            await dataset.import(userProfileDataset.toStream());
            // console.log(await rdf.io.dataset.toText('text/turtle', dataset));
            const validator = new Validator(dataset, { factory: rdfDataModel });
            const report = await validator.validate({ dataset });
            if (report.conforms) {
                summary.valid.arr.push(title);
                continue;
            }
            let hasMissingData = false;
            for (let result of report.results) {
                // HasValueConstraintComponent too?
                if (result.constraintComponent.value.split("#")[1] === "MinCountConstraintComponent") {
                    hasMissingData = true;
                    break;
                }
            }
            if (hasMissingData) {
                summary.missingData.arr.push(title);
                continue;
            }
            summary.invalid.arr.push(title);
        }
        callback(summary);
    });
}

async function extractTitleFromShaclFile(path) {
    const data = await fsPromise.readFile(path, "utf8");
    const titleRegex = /ckg:title\s*"([^"]+)"/;
    const match = data.match(titleRegex);
    if (!match) return "no title";
    return match[1];
}

async function materialiseInferenceInMemory(userProfileDataset) {
    let store = new Store();
    store.import(userProfileDataset.toStream());
    let sameAsPairs = [];

    const queryEngineFile = new QueryEngineFile();
    await queryEngineFile.invalidateHttpCache();
    let query = `
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        SELECT * WHERE {
            ?s owl:sameAs ?o .
        }`;
    const bindingsStream = await queryEngineFile.queryBindings(query, {
        sources: [{ type: "file", value: INFERENCE_FILE }],
    });
    let bindings = await bindingsStream.toArray();
    for (let binding of bindings) {
        sameAsPairs.push([binding.get("s").value, binding.get("o").value]);
    }

    const queryEngine = new QueryEngine();
    await queryEngine.invalidateHttpCache();
    for (let pair of sameAsPairs) {
        let from = pair[0];
        let to = pair[1];
        query = `
            PREFIX ckg: <http://ckg.de/default#>
            PREFIX fim: <https://test.schema-repository.fitko.dev/fields/baukasten/>
            CONSTRUCT {
                ckg:mainPerson <${to}> ?value .
            } WHERE {
                ckg:mainPerson <${from}> ?value .
            }`;
        let quadsStream = await queryEngine.queryQuads(query, { sources: [store] });
        let quads = await quadsStream.toArray();
        for (let quad of quads) {
            userProfileDataset.add(quad);
        }
    }
}

