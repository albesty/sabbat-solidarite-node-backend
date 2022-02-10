import db from "../../db/models/index.js";
const ROLES = db.ROLES;
const User = db.user;

async function checkDuplicateUsernameOrEmail(req, res, next) {
  try {
    const userByEmail = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (userByEmail)
      return res
        .status(400)
        .send({ message: "L'adresse mail est déjà enregistrée." });
    next();
  } catch (e) {
    next(e);
  }
}

async function checkDuplicatePhoneNumber(req, res, next) {
  try {
    const userByPhone = await User.findOne({
      where: {
        phone: req.body.phone,
      },
    });
    if (userByPhone)
      return res
        .status(400)
        .send({ message: "Ce numero de telephone existe déjà." });
    next();
  } catch (e) {
    next(e);
  }
}

function checkRolesExisted(req, res, next) {
  const roles = req.body.roles;
  if (roles) {
    for (let i = 0; i < roles.length; i++) {
      if (!ROLES.includes(roles[i])) {
        return res.status(400).send(`Le role ${roles[i]} n'existe pas`);
      }
    }
  }
  next();
}

export {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  checkDuplicatePhoneNumber,
};
