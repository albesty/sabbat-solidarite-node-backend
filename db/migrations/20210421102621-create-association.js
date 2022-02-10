"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("associations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nom: {
        type: Sequelize.STRING,
      },
      code: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      validationLenght: {
        type: Sequelize.INTEGER,
      },
      avatar: Sequelize.STRING,
      cotisationMensuelle: Sequelize.INTEGER,
      frequenceCotisation: Sequelize.STRING,
      statut: {
        type: Sequelize.STRING,
      },
      fondInitial: {
        type: Sequelize.INTEGER,
      },
      solde: {
        type: Sequelize.FLOAT,
      },
      penality: {
        type: Sequelize.INTEGER,
      },
      seuilSecurite: Sequelize.INTEGER,
      reglementInterieur: {
        type: Sequelize.STRING,
      },
      individualQuotite: {
        type: Sequelize.INTEGER,
      },
      interetCredit: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("associations");
  },
};
