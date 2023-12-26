import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fromFile from "rdf-utils-fs/fromFile.js";
import rdf from "rdf-ext";
import rdfDataModel from "@rdfjs/data-model";
import Validator from "shacl-engine/Validator.js";

export function validateAll(userProfileDataset, callback) {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "shacl");

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

    fs.readdir(dir, async (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const shaclFile of files) {
            let requirementProfile = shaclFile.split(".")[0];
            const dataset = await rdf.dataset().import(fromFile(`${dir}/${shaclFile}`));
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