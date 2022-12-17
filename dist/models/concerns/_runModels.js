"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const initdb_1 = require("./initdb");
const competition_1 = __importDefault(require("../competition"));
const player_1 = __importDefault(require("../player"));
const team_1 = __importDefault(require("../team"));
const teamscompetitions_1 = __importDefault(require("../teamscompetitions"));
(0, initdb_1.checkAuthentication)(initdb_1.sequelize);
competition_1.default.belongsToMany(team_1.default, {
    through: teamscompetitions_1.default,
    as: 'teams'
});
player_1.default.belongsTo(team_1.default, {
    foreignKey: 'teamId',
    as: 'team'
});
team_1.default.hasMany(player_1.default);
team_1.default.belongsToMany(competition_1.default, {
    through: teamscompetitions_1.default,
    as: 'competitions'
});
(async () => {
    await initdb_1.sequelize.sync();
})();
