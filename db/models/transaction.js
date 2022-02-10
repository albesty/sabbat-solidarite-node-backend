"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class transaction extends Model {
    static associate(models) {
      // define association here
      transaction.belongsTo(models.user);
    }
  }

  transaction.init(
    {
      libelle: DataTypes.STRING,
      number: DataTypes.STRING,
      typeTransac: DataTypes.STRING,
      reseau: DataTypes.STRING,
      montant: DataTypes.INTEGER,
      numero: DataTypes.STRING,
      statut: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "transaction",
    }
  );

  return transaction;
};
