import express from "express";
import formats from "@rdfjs/formats";
import { Readable } from "readable-stream";
import { write } from "./solid.js";

const PORT = 3030;
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("node_modules"));

app.listen(PORT ,() => console.log("server is running at port " + PORT));

app.post("/dev", (req, res) => {
    console.log(req.body);
    res.send({ msg: "received" });
});

app.post("/insertData", (req, res) => {
    const triples = req.body.triples;
    console.log(triples);

    const input = Readable.from([triples])
    const output = formats.parsers.import('text/turtle', input)
    output.on('data', quad => {
        console.log(`quad: ${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
    })
    output.on('prefix', (prefix, ns) => {
        console.log(`prefix: ${prefix} ${ns.value}`)
    })

    write(triples).then(() => {
        res.send({ msg: "Stored in Solid" });
    });
});
