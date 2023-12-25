import express from "express";
import formats from "@rdfjs/formats";
import { Readable } from "readable-stream";
import { auth, write, read } from "./solid.js";

const PORT = 3030;
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("node_modules"));

app.listen(PORT ,() => console.log("server is running at port " + PORT));

app.post("/insertData", async (req, res) => {
    const triples = req.body.triples;

    await auth();
    await write(triples);
    await read(str => {
        res.send({ turtle: str });
    });

    const input = Readable.from([triples])
    const output = formats.parsers.import('text/turtle', input)
    output.on('data', quad => {
        console.log(`quad: ${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
    })
});
