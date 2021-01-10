const express = require("express");
const Student = require("../models/student");
const csv2json = require("csvjson-csv2json");
const fs = require("fs");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.render("index", {
      // csrfToken: req.csrfToken(),
      user: req.user,
    });
  } catch (e) {
    console.log(e);
    res.send("Something Went Wrong <br>" + e);
  }
});

router.post("/result", async (req, res) => {
  try {
    // console.log(req.body.roll_no.toUpperCase());
    const result = await Student.findOne({
      roll_number: req.body.roll_no.toUpperCase(),
    });
    if (result === null) {
      throw "Invalid Unique Id";
    }
    // console.log(result);
    res.render("result", {
      result,
    });
  } catch (e) {
    console.log(e);
    res.status(404).render("404", {
      message: e,
    });
    // res.send("Something Went Wrong <br>" + e);
  }
});

router.get("/demo", async (req, res) => {
  try {
    res.render("demo");
  } catch (e) {
    res.send(`Something Went Wrong <br> ${e}`);
  }
});

// router.get("/add", async (req, res) => {
//   try {
//     fs.readFile("./data.csv", async (err, data) => {
//       const csv = data.toString("utf8");
//       const json = csv2json(csv, { parseNumbers: true, parseJSON: true });
//       console.log(json);
//       await Student.insertMany(json);
//     });
//     console.log("saved");
//     res.send("uploaded");
//   } catch (e) {
//     console.log(e);
//     res.send("Something Went Wrong <br>" + e);
//   }
// });

// router.get("/check", async(res, req)=>{
//   const student = await Student.find({})
//   console.log(student)
// })
module.exports = router;
