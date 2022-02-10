"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class association extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      association.belongsToMany(models.user, {
        through: models.member,
      });
      association.hasMany(models.cotisation);

      association.hasMany(models.information);
    }
  }
  association.init(
    {
      nom: DataTypes.STRING,
      description: DataTypes.STRING,
      code: DataTypes.STRING,
      avatar: DataTypes.STRING,
      cotisationMensuelle: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      penality: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      frequenceCotisation: {
        type: DataTypes.STRING,
        defaultValue: "mensuelle",
      },
      statut: {
        type: DataTypes.STRING,
        defaultValue: "standard",
      },
      fondInitial: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      solde: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      seuilSecurite: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      individualQuotite: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isValid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      telAdmin: {
        type: DataTypes.STRING,
      },
      reglementInterieur: DataTypes.STRING,
      interetCredit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      validationLenght: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "association",
    }
  );
  return association;
};
