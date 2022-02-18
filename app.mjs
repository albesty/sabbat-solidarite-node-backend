import dotenv from "dotenv";
dotenv.config();
import logger from "./src/utilities/logger.mjs";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import prod from "./src/startup/prod.mjs";

const app = express();

logger.log();

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL ERROR, la clef privée jwt nexiste pas");
  process.exit(1);
}

const corsOption = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};

app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

import db from "./db/models/index.js";
db.sequelize
  .sync()
  .then(() => {
    logger.log("the app has been successfully connected to the database");
  })
  .catch((error) => {
    logger.log(error);
  });
import { routes } from "./src/startup/routes.mjs";
routes(app);
prod(app);
app.use(function (err, req, res, next) {
  let statusCode;
  if (!err.statusCode) statusCode = 500;
  else statusCode = err.statusCode;
  logger.log(err.message ? err.message : err.stack);
  const errorMessage = err.message || err.details;
  let message = "Nous avons rencontré une erreur interne.";
  if (errorMessage && errorMessage.keys().length > 0) message = errorMessage;
  res.status(statusCode).send({ message });
});

export { app };
