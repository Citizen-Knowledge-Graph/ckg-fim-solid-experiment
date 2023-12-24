import express from "express";
import cors from "cors";

const PORT = 3030;
const app = express();
app.use(cors());
app.use(express.json());

app.listen(PORT ,() => console.log("server is running at port " + PORT));
app.get("/", (req, res) => res.send("root"));

app.post("/dev", (req, res) => {
    console.log(req.body);
    res.send({ msg: "received" });
});
