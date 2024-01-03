import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fromFile from "rdf-utils-fs/fromFile.js";
import rdf from "rdf-ext";
import rdfDataModel from "@rdfjs/data-model";
import Validator from "shacl-engine/Validator.js";
import { Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { QueryEngine as QueryEngineFile } from "@comunica/query-sparql-file";

export async function validateAll(userProfileDataset, useInference, callback) {
    const db = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db");
    const shaclDir = `${db}/shacl`;

    if (useInference) {
        let store = new Store();
        store.import(userProfileDataset.toStream());
        let sameAsPairs = [];

        const queryEngineFile = new QueryEngineFile();
        let query = `
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT * WHERE {
                ?s owl:sameAs ?o .
            }`;
        const bindingsStream = await queryEngineFile.queryBindings(query, {
            sources: [{ type: "file", value: db + "/inference.ttl" }],
        });
        let bindings = await bindingsStream.toArray();
        for (let binding of bindings) {
            sameAsPairs.push([binding.get("s").value, binding.get("o").value]);
        }

        const queryEngine = new QueryEngine();
        for (let pair of sameAsPairs) {
            let from = pair[0];
            let to = pair[1];
            query = `
                PREFIX ckg: <http://ckg.de/default#>
                PREFIX fim: <https://test.schema-repository.fitko.dev/fields/baukasten/>
                CONSTRUCT {
                    ckg:FimDataField ckg:used <${to}> .
                    ?dataFieldInstance a <${to}> .
                } WHERE {
                    ckg:FimDataField ckg:used <${from}> .
                    ?dataFieldInstance a <${from}> .
                }`;
            let quadsStream = await queryEngine.queryQuads(query, { sources: [store] });
            let quads = await quadsStream.toArray();
            for (let quad of quads) {
                userProfileDataset.add(quad);
            }
        }
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

    fs.readdir(shaclDir, async (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const shaclFile of files) {
            let requirementProfile = shaclFile.split(".")[0];
            const dataset = await rdf.dataset().import(fromFile(`${shaclDir}/${shaclFile}`));
            await dataset.import(userProfileDataset.toStream());
            // console.log(await rdf.io.dataset.toText('text/turtle', dataset));
            const validator = new Validator(dataset, { factory: rdfDataModel });
            const report = await validator.validate({ dataset });
            if (report.conforms) {
                summary.valid.arr.push(requirementProfile);
                continue;
            }
            let hasMissingData = false;
            for (let result of report.results) {
                if (result.constraintComponent.value.split("#")[1] === "MinCountConstraintComponent") {
                    hasMissingData = true;
                    break;
                }
            }
            if (hasMissingData) {
                summary.missingData.arr.push(requirementProfile);
                continue;
            }
            summary.invalid.arr.push(requirementProfile);
        }
        callback(summary);
    });
}
