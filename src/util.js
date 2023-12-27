import decode from "stream-chunks/decode.js";
import Serializer from "@rdfjs/serializer-turtle";

const PREFIX = {
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "fim": "https://test.schema-repository.fitko.dev/fields/baukasten/",
    "ckg": "http://ckg.de/default#"
};

export function datasetToTurtle(dataset) {
    // import prettyFormats from "@rdfjs/formats/pretty.js"; <-- try this approach TODO
    // rdf.formats.import(prettyFormats);
    const serializer = new Serializer();
    const output = serializer.import(dataset.toStream());
    return decode(output).then(turtle => {
        return prefixifyTurtle(turtle);
    });
}

function prefixifyTurtle(turtle) {
    let prefixesPart = "";
    for (const [key, value] of Object.entries(PREFIX)) {
        prefixesPart += `@prefix ${key}: <${value}> .\n`;
        const regex = new RegExp(`<${value}([^>]*)>`, "g");
        turtle = turtle.replace(regex, `${key}:$1`);
    }
    return `${prefixesPart}\n${turtle}`;
}
