import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fromFile from "rdf-utils-fs/fromFile.js";
import rdf from "rdf-ext";

export async function validateAll() {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "shacl");
    fs.readdir(dir, async (err, files) => {
        if (err) return console.error(err);
        for (const file of files) {
            const dataset = await rdf.dataset().import(fromFile(`${dir}/${file}`));
            console.log(await rdf.io.dataset.toText('text/turtle', dataset));
        }
    });
}
