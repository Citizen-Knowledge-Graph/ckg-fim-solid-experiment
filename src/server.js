import express from "express";
import { auth, write, read } from "./solid.js";
import { validateAll } from "./validation.js";
import { datasetToTurtle } from "./util.js";

const PORT = 3030;
const app = express();
app.use(express.json());
app.use(express.static("public", { extensions: ["html"] }));
app.use(express.static("node_modules"));

app.listen(PORT ,() => console.log("server is running at port " + PORT));

app.post("/insertData", async (req, res) => {
    await auth();
    await write(req.body.nTriples);
    await read(async dataset => {
        res.send({ turtle: await datasetToTurtle(dataset) });
    });
});

app.get("/runChecks", async (req, res) => {
    await auth();
    await read(dataProfile => {
        validateAll().then(results => {
            res.send({ results: results })
        });
    });
});
