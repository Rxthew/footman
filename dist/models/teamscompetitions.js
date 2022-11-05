"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const app_1 = require("../app");
const competition_1 = __importDefault(require("./competition"));
const team_1 = __importDefault(require("./team"));
const TeamsCompetitions = app_1.sequelize.define('TeamsCompetitions', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    team_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: team_1.default,
            key: 'id'
        },
        allowNull: false
    },
    competition_id: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: competition_1.default,
            key: 'id'
        },
        allowNull: false
    },
    points: {
        type: sequelize_1.DataTypes.INTEGER
    },
    season: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    }
});
exports.default = TeamsCompetitions;
