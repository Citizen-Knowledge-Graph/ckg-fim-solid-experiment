import { QueryEngine } from "@comunica/query-sparql-solid";
import { interactiveLogin } from "solid-node-interactive-auth";
import rdf from "rdf-ext";
import decode from "stream-chunks/decode.js";
import Serializer from "@rdfjs/serializer-turtle";
import { prefixifyTurtle } from "./util.js";

const SERVER = "http://localhost:3000";
const POD = "ckg-pod";
const PROFILE_NAME = "main-profile";
const PROFILE_URL = `${SERVER}/${POD}/${PROFILE_NAME}`;

let session;

export async function auth() {
    session = await interactiveLogin({ oidcIssuer: SERVER });
    console.log(session.info);
}

export async function read(callback) {
    const engine = new QueryEngine();
    let query = `SELECT * WHERE { ?s ?p ?o }`;

    const bindingsStream = await engine.queryBindings(query, {
        sources: [PROFILE_URL],
        '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    });

    let quads = [];

    bindingsStream.on('data', (binding) => {
        quads.push(rdf.quad(binding.get("s"), binding.get("p"), binding.get("o")));
    });
    bindingsStream.on('end', () => {
        const serializer = new Serializer();
        const output = serializer.import(rdf.dataset(quads).toStream());
        decode(output).then(turtle => {
            callback(prefixifyTurtle(turtle));
        });
    });
    bindingsStream.on('error', err => console.error(err));
}

export async function write(triples) {
    const engine = new QueryEngine();
    let query = `INSERT DATA { ${triples} }`;

    await engine.queryVoid(query, {
        sources: [PROFILE_URL],
        '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    });
}

// read().then(() => {});
// write().then(() => { process.exit(0); });
