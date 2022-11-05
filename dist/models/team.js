"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const app_1 = require("../app");
const competition_1 = __importDefault(require("./competition"));
const teamscompetitions_1 = __importDefault(require("./teamscompetitions"));
const player_1 = __importDefault(require("./player"));
const Team = app_1.sequelize.define('Team', {
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
Team.hasMany(player_1.default);
Team.belongsToMany(competition_1.default, { through: teamscompetitions_1.default });
exports.default = Team;
