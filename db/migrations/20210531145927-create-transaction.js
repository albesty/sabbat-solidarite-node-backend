"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      libelle: {
        type: Sequelize.STRING,
      },
      number: {
        type: Sequelize.STRING,
      },
      typeTransac: {
        type: Sequelize.STRING,
      },
      reseau: {
        type: Sequelize.STRING,
      },
      montant: {
        type: Sequelize.INTEGER,
      },
      statut: {
        type: Sequelize.STRING,
      },
      numero: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("transactions");
  },
};
