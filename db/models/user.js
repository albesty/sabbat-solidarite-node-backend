"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.belongsToMany(models.association, {
        through: models.member,
      });
      user.belongsToMany(models.role, {
        through: "user_roles",
      });
      user.hasMany(models.transaction);
    }
  }
  user.init(
    {
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      pinToken: DataTypes.STRING,
      nom: DataTypes.STRING,
      prenom: DataTypes.STRING,
      wallet: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      phone: DataTypes.STRING,
      adresse: DataTypes.STRING,
      avatar: DataTypes.STRING,
      profession: {
        type: DataTypes.STRING,
      },
      emploi: {
        type: DataTypes.STRING,
      },
      isFirstTimeConnect: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      pushNotificationToken: {
        type: DataTypes.STRING,
      },
      piece: DataTypes.ARRAY(DataTypes.STRING),
    },
    {
      sequelize,
      modelName: "user",
    }
  );
  return user;
};
