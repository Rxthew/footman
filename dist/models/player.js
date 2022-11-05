"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const app_1 = require("../app");
const team_1 = __importDefault(require("./team"));
const Player = app_1.sequelize.define('Player', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    name: {
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
});
Player.belongsTo(team_1.default);
exports.default = Player;
