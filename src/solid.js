import { QueryEngine } from "@comunica/query-sparql-solid";
import { interactiveLogin } from "solid-node-interactive-auth";
import rdf from "rdf-ext";

const SERVER = "http://localhost:3000";
const POD = "ckg-pod";
const PROFILE_NAME = "main-profile";
const PROFILE_URL = `${SERVER}/${POD}/${PROFILE_NAME}`;

let session;

export async function solidAuth() {
    session = await interactiveLogin({ oidcIssuer: SERVER });
    // console.log(session.info);
}

export async function solidRead(callback) {
    const engine = new QueryEngine();
    await engine.invalidateHttpCache();
    let query = `SELECT * WHERE { ?s ?p ?o }`;
    let quads = [];

    const bindingsStream = await engine.queryBindings(query, {
        sources: [PROFILE_URL],
        '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    });
    // let bindings = await bindingsStream.toArray(); TODO ?
    bindingsStream.on('data', (binding) => {
        quads.push(rdf.quad(binding.get("s"), binding.get("p"), binding.get("o")));
    });
    bindingsStream.on('end', () => {
        callback(rdf.dataset(quads));
    });
    bindingsStream.on('error', err => console.error(err));
}

export async function solidWrite(triples) {
    const engine = new QueryEngine();
    let query = `INSERT DATA { ${triples} }`;

    await engine.queryVoid(query, {
        sources: [PROFILE_URL],
        '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    });
}
