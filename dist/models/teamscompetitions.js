"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const initdb_1 = require("./concerns/initdb");
const competition_1 = __importDefault(require("./competition"));
const team_1 = __importDefault(require("./team"));
const TeamsCompetitions = initdb_1.sequelize.define('TeamsCompetitions', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    teamId: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: team_1.default,
            key: 'id'
        },
    },
    competitionId: {
        type: sequelize_1.DataTypes.UUID,
        references: {
            model: competition_1.default,
            key: 'id'
        },
    },
    points: {
        type: sequelize_1.DataTypes.INTEGER
    },
    season: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'competitions_table'
});
exports.default = TeamsCompetitions;
