"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const initdb_1 = require("./concerns/initdb");
const Player = initdb_1.sequelize.define('player', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    nationality: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: sequelize_1.DataTypes.INTEGER
    },
    position: {
        type: sequelize_1.DataTypes.STRING
    },
    goals: {
        type: sequelize_1.DataTypes.INTEGER
    },
    assists: {
        type: sequelize_1.DataTypes.INTEGER
    },
    speed: {
        type: sequelize_1.DataTypes.INTEGER
    },
    strength: {
        type: sequelize_1.DataTypes.INTEGER
    },
    attack: {
        type: sequelize_1.DataTypes.INTEGER
    },
    defense: {
        type: sequelize_1.DataTypes.INTEGER
    },
    goalkeeping: {
        type: sequelize_1.DataTypes.INTEGER
    },
    intelligence: {
        type: sequelize_1.DataTypes.INTEGER
    },
    technique: {
        type: sequelize_1.DataTypes.INTEGER
    },
}, {
    tableName: 'players'
});
exports.default = Player;
