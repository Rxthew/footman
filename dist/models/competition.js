"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const app_1 = require("../app");
const team_1 = __importDefault(require("./team"));
const teamscompetitions_1 = __importDefault(require("./teamscompetitions"));
const Competition = app_1.sequelize.define('Competition', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
});
Competition.belongsToMany(team_1.default, { through: teamscompetitions_1.default });
exports.default = Competition;
