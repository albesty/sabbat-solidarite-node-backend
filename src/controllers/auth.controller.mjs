import jwt from "jsonwebtoken";
import bcryp from "bcryptjs";

import db from "../../db/models/index.js";
const User = db.user;
const Role = db.role;
const Op = db.Sequelize.Op;

async function signup(req, res, next) {
  try {
    let user = await User.create({
      email: req.body.email,
      password: bcryp.hashSync(req.body.password, 8),
    });
    const roles = req.body.roles;
    if (roles) {
      const userRoles = await Role.findAll({
        where: {
          name: {
            [Op.or]: roles,
          },
        },
      });
      await user.setRoles(userRoles);
      return res.status(201).send("L'utilisateur a été enregistré avec succès");
    } else {
      await user.setRoles([1]);
      return res.status(201).send("L'utilisateur a été enregistré avec succès");
    }
  } catch (e) {
    next(e);
  }
}

async function signin(req, res, next) {
  try {
    let currentUser;
    let loggingBy = "";
    if (req.body.username) {
      loggingBy = "Pseudo";
      currentUser = await User.findOne({
        where: {
          username: req.body.username,
        },
      });
    }
    if (req.body.email) {
      loggingBy = "Email";
      currentUser = await User.findOne({
        where: {
          email: req.body.email,
        },
      });
    }

    if (!currentUser)
      return res.status(404).send({ message: `${loggingBy} n'existe pas.` });
    const passwordIsValid = bcryp.compareSync(
      req.body.password,
      currentUser.password
    );
    if (!passwordIsValid) {
      return res.status(401).send({
        accesstoken: null,
        message: "Password invalide",
      });
    }

    let authorities = [];
    const memberRoles = await currentUser.getRoles();
    for (let i = 0; i < memberRoles.length; i++) {
      authorities.push("ROLE_" + memberRoles[i].name.toUpperCase());
    }
    const selectedUser = await User.findByPk(currentUser.id, {
      attributes: { exclude: ["password"] },
    });
    let token = jwt.sign(
      {
        id: currentUser.id,
        username: selectedUser.username,
        email: selectedUser.email,
        roles: authorities,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 86400,
      }
    );

    const data = selectedUser.dataValues;
    return res.status(201).send({
      user: data,
      roles: authorities,
      accessToken: token,
    });
  } catch (e) {
    next(e);
  }
}

const signinByPin = async (req, res, next) => {
  try {
    let currentUser;
    const newToken = jwt.sign(req.body.codePin, process.env.JWT_SECRET);
    currentUser = await User.findOne({
      where: {
        pinToken: newToken,
        phone: req.body.phone,
      },
    });
    if (!currentUser)
      return res.status(404).send({ message: "User non trouvé" });
    let authorities = [];
    const memberRoles = await currentUser.getRoles();
    for (let i = 0; i < memberRoles.length; i++) {
      authorities.push("ROLE_" + memberRoles[i].name.toUpperCase());
    }
    const selectedUser = await User.findByPk(currentUser.id, {
      attributes: { exclude: ["password", "pinToken"] },
    });
    let token = jwt.sign(
      {
        id: currentUser.id,
        username: selectedUser.username,
        email: selectedUser.email,
        roles: authorities,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 86400,
      }
    );

    const data = selectedUser.dataValues;
    return res.status(201).send({
      user: data,
      roles: authorities,
      accessToken: token,
    });
  } catch (e) {
    next(e.message);
  }
};

const signupByPin = async (req, res, next) => {
  try {
    const pinToken = jwt.sign(req.body.codePin, process.env.JWT_SECRET);
    let user = await User.create({
      phone: req.body.phone,
      pinToken: pinToken,
    });
    const roles = req.body.roles;
    if (roles) {
      const userRoles = await Role.findAll({
        where: {
          name: {
            [Op.or]: roles,
          },
        },
      });
      await user.setRoles(userRoles);
      return res.status(201).send("L'utilisateur a été enregistré avec succès");
    } else {
      await user.setRoles([1]);
      return res.status(201).send("L'utilisateur a été enregistré avec succès");
    }
  } catch (e) {
    next(e);
  }
};

export { signup, signin, signupByPin, signinByPin };
