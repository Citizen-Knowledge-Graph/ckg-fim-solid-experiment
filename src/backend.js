import express from "express";
import { auth, write, read } from "./solid.js";

const PORT = 3030;
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("node_modules"));

app.listen(PORT ,() => console.log("server is running at port " + PORT));

app.post("/insertData", async (req, res) => {
    await auth();
    await write(req.body.nTriples);
    await read(turtle => {
        res.send({ turtle: turtle });
    });
});
