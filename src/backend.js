import express from "express";

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
