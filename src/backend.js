import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { auth, write, read } from "./solid.js";

const PORT = 3030;
const app = express();
app.use(express.json());
app.use(express.static("public", { extensions: ["html"] }));
app.use(express.static("node_modules"));

app.listen(PORT ,() => console.log("server is running at port " + PORT));

app.post("/insertData", async (req, res) => {
    await auth();
    await write(req.body.nTriples);
    await read(turtle => {
        res.send({ turtle: turtle });
    });
});

app.get("/runChecks", async (req, res) => {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "shacl");
    fs.readdir(dir, (err, files) => {
        if (err) return console.error(err);
        for (const file of files) {
            console.log(file);
        }
    });
    res.send({ results: [] })
});
