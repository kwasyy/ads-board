const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const getImageFileType = require("../utils/getImageFileType");
const fs = require("fs");

exports.register = async (req, res) => {
  try {
    const { login, password } = req.body;
    const fileType = req.file ? await getImageFileType(req.file) : "unknown";
    console.log(req.body, req.file)
    if (
      login &&
      typeof login === "string" &&
      password &&
      typeof password === "string" &&
      req.file &&
      ["image/png", "image/jpeg", "image/gif"].includes(fileType)
    ) {
      const userWithLogin = await User.findOne({ login });
      if (userWithLogin) {
        if (req.file) {
            const filePath = req.file.path;
            fs.unlinkSync(filePath);
          }
        return res
          .status(409)
          .send({ message: "User with this login already exists" });
      }

      const user = await User.create({
        login,
        password: await bcrypt.hash(password, 10),
      });
      req.session.user = {
        id: user._id,
        login: user.login,
      };
      res
        .status(201)
        .send({ message: "User creater" + user.login + "id =" + user._id });
    } else {
     if (req.file) {
        const filePath = req.file.path;
        fs.unlinkSync(filePath);
      }
      return res.status(400).send({ message: "Bad request" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (
      login &&
      typeof login === "string" &&
      password &&
      typeof password === "string"
    ) {
      const user = await User.findOne({ login });
      if (!user) {
        res.status(400).send({ message: "Login or Password are incorrect" });
      } else {
        if (bcrypt.compareSync(password, user.password)) {
          req.session.user = {
            id: user._id,
            login: user.login,
          };
          res.status(200).send({ message: "Login succesful" });
        } else {
          res.status(400).send({ message: "Login or Password are incorrect" });
        }
      }
    } else {
      res.status(400).send({ message: "Bad request" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getUser = async (req, res) => {
  if (req.session.user) {
    res.send(`User: ${req.session.user.login}, ID: ${req.session.user.id}`);
  } else {
    res.status(401).send({ message: "You are not logged in" });
  }
};

exports.userLogout = async (req, res) => {
    req.session.destroy();
    res.json({ message: "You are logged out" });
  };