import express from "express";
import { solidAuth, solidWrite, solidRead, solidClear } from "./solid.js";
import { validateAll } from "./validation.js";
import { datasetToTurtle } from "./util.js";

const PORT = 3030;
const app = express();
app.use(express.json());
app.use(express.static("public", { extensions: ["html"] }));
app.use(express.static("node_modules"));

app.listen(PORT ,() => console.log("server is running at port " + PORT));

app.post("/insertData", async (req, res) => {
    await solidAuth();
    await solidWrite(req.body.nTriples);
    // console.log("Inserting: " + req.body.nTriples);
    res.send({});
});

app.get("/viewData", async (req, res) => {
    await solidAuth();
    await solidRead(async dataset => {
        res.send({ turtle: await datasetToTurtle(dataset) });
    });
});

app.delete("/clearData", async (req, res) => {
    await solidAuth();
    await solidClear();
    res.send({});
});

app.get("/runChecks", async (req, res) => {
    const useInference = req.query.useInference === "true";
    await solidAuth();
    await solidRead(dataset => {
        validateAll(dataset, useInference, summary =>
            res.send({ summary: summary })
        );
    });
});
