"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tranche extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tranche.belongsTo(models.engagement);
      tranche.hasMany(models.payement);
    }
  }
  tranche.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      montant: DataTypes.INTEGER,
      libelle: DataTypes.STRING,
      solde: DataTypes.INTEGER,
      echeance: DataTypes.DATE,
      checkedForPenality: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "tranche",
    }
  );
  return tranche;
};
