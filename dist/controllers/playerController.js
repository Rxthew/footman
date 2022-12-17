"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seePlayer = void 0;
const helpers_1 = require("./helpers");
const player_1 = __importDefault(require("../models/player"));
require("../models/concerns/_runModels");
let seePlayerAttributes = function () {
    return helpers_1.attributesPlaceholders.seePlayer;
};
const seePlayerRenderer = helpers_1.renderers.seePlayer;
let seePlayerResults = {
    firstName: '',
    lastName: '',
    nationality: '',
    teamName: ''
};
const seePlayerCb = async function (t) {
    const seePlayerQuery = async function () {
        const attributes = seePlayerAttributes();
        const player = await player_1.default.findOne({
            where: {
                firstName: attributes.firstName,
                lastName: attributes.lastName,
                nationality: attributes.nationality
            },
            transaction: t
        });
        const team = await (player === null || player === void 0 ? void 0 : player.getTeam());
        return {
            player,
            team
        };
    };
    const results = await seePlayerQuery();
    const populateSeePlayerResults = function () {
        if (results.player && results.team) {
            Object.assign(seePlayerResults, results.player.get(), { teamName: results.team.getDataValue('name') });
        }
        else {
            const err = new Error('Query returned invalid data.');
            throw err;
        }
    };
    try {
        populateSeePlayerResults();
    }
    catch (err) {
        console.log(err);
    }
    return;
};
const seePlayer = async function (req, res, next) {
    const attributes = (0, helpers_1.syncAttributes)();
    attributes.getSeePlayerAttributes(req, next);
    await (0, helpers_1.transactionWrapper)(seePlayerCb);
    seePlayerRenderer(res, seePlayerResults);
    return;
};
exports.seePlayer = seePlayer;
