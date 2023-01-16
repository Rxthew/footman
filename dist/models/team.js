"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const initdb_1 = require("./concerns/initdb");
const Team = initdb_1.sequelize.define('team', {
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false
    }
}, {
    tableName: 'teams'
});
exports.default = Team;
