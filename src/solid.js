import { QueryEngine } from "@comunica/query-sparql-solid";
import { interactiveLogin } from "solid-node-interactive-auth";

const SERVER = "http://localhost:3000";
const POD = "ckg-pod";
const PROFILE_NAME = "main-profile";
const PROFILE_URL = `${SERVER}/${POD}/${PROFILE_NAME}`;

async function read() {
    const session = await interactiveLogin({ oidcIssuer: SERVER });
    console.log(session.info);
    const engine = new QueryEngine();
    let query = `x
        SELECT * WHERE { ?s ?p ?o } 
    `;

    const bindingsStream = await engine.queryBindings(query, {
        sources: [PROFILE_URL],
        '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    });

    bindingsStream.on('data', (binding) => {
        console.log(binding.toString());
    });
    bindingsStream.on('end', () => {
        process.exit(0);
    });
    bindingsStream.on('error', (error) => {
        console.error(error);
    });
}

async function write() {
    const session = await interactiveLogin({ oidcIssuer: SERVER });
    const engine = new QueryEngine();
    let query = `
        PREFIX ckg: <http://ckg.de/default#>
        INSERT DATA { <ckg:sub> <ckg:pred> <ckg:obj> }
    `;

    await engine.queryVoid(query, {
        sources: [PROFILE_URL],
        '@comunica/actor-http-inrupt-solid-client-authn:session': session,
    });
}

read().then(() => {});
// write().then(() => { process.exit(0); });
