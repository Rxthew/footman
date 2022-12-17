"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionWrapper = exports.syncAttributes = exports.renderers = exports.attributesPlaceholders = void 0;
const initdb_1 = require("../models/concerns/initdb");
exports.attributesPlaceholders = {
    seePlayer: {
        firstName: '',
        lastName: '',
        nationality: ''
    },
};
exports.renderers = {
    seePlayer: function (res, results) {
        res.render('seePlayer', {
            name: results.firstName + ' ' + results.lastName,
            teamName: results.teamName,
            nationality: results.nationality,
            age: results.age,
            position: results.position,
            goals: results.goals,
            assists: results.assists,
            speed: results.speed,
            strength: results.strength,
            attack: results.attack,
            defense: results.defense,
            goalkeeping: results.goalkeeping,
            intelligence: results.intelligence,
            technique: results.technique
        });
    }
};
const syncAttributes = function () {
    const _emptyStringHandler = function (value) {
        const error = new Error('Something went wrong when fetching the details.');
        const throwError = () => { throw error; };
        return value === '' || value === undefined ? throwError() : null;
    };
    const _assessRequestParameters = function (req, next, placeholderProperty) {
        var _a;
        try {
            if (Object.prototype.hasOwnProperty.call(exports.attributesPlaceholders, placeholderProperty)) {
                let attributes = Object.assign({}, exports.attributesPlaceholders[placeholderProperty]);
                for (let name of Object.keys(attributes)) {
                    attributes[name] = req.params[name] ? req.params[name] : '';
                    _emptyStringHandler((_a = attributes[name]) === null || _a === void 0 ? void 0 : _a.toString());
                }
                Object.assign(exports.attributesPlaceholders, { [placeholderProperty]: attributes });
            }
        }
        catch (error) {
            console.log(error);
            next(error);
        }
    };
    return {
        getSeePlayerAttributes: function (req, next) {
            _assessRequestParameters(req, next, 'seePlayer');
        }
    };
};
exports.syncAttributes = syncAttributes;
const transactionWrapper = async function (callback) {
    try {
        const result = await initdb_1.sequelize.transaction(callback);
    }
    catch (error) {
        console.log(error);
    }
};
exports.transactionWrapper = transactionWrapper;
