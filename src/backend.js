import express from "express";
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
    write(triples).then(() => {
        res.send({ msg: "Stored in Solid" });
    });
});
