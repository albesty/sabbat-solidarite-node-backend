"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      member.belongsToMany(models.cotisation, {
        through: models.member_cotisation,
      });
      member.hasMany(models.engagement, {
        as: "Creator",
        foreignKey: "creatorId",
      });
      member.belongsToMany(models.engagement, {
        as: "Votor",
        through: models.vote,
        foreignKey: "votorId",
        otherKey: "engagementId",
      });
      member.belongsToMany(models.information, {
        through: models.member_info,
      });
      member.belongsToMany(models.role, {
        through: "member_roles",
      });
    }
  }
  member.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      statut: DataTypes.STRING,
      fonds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      avatar: DataTypes.STRING,
      relation: DataTypes.STRING,
      adhesionDate: DataTypes.DATE,
      backImage: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "member",
    }
  );
  return member;
};
