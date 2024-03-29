"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamParameters = exports.getPlayerParameters = exports.getCompetitionParameters = exports.teamParameterPlaceholder = exports.playerParameterPlaceholder = exports.competitionParameterPlaceholder = void 0;
const competitionParameters = {
    name: '',
    code: undefined
};
const playerParameters = {
    firstName: '',
    lastName: '',
    code: undefined
};
const teamParameters = {
    name: '',
    code: undefined
};
const _resetPlaceholderParameters = function (obj) {
    const placeholders = Object.assign({}, obj);
    const resetAttributes = function () {
        Object.assign(obj, placeholders);
    };
    return resetAttributes;
};
const _syncParameters = function (placeholderObject) {
    const _emptyResultHandler = function (value) {
        const error = new Error('Something went wrong when fetching the requested details.');
        const throwError = () => { throw error; };
        return value === '' || value === undefined ? throwError() : null;
    };
    const _assessRequestParameters = function (req, next) {
        try {
            const attributes = Object.assign({}, placeholderObject);
            for (const name of Object.keys(attributes)) {
                attributes[name] = req.params[name] ? req.params[name] : attributes[name];
                _emptyResultHandler(typeof attributes[name] === undefined ? attributes[name] : attributes[name]?.toString());
            }
            Object.assign(placeholderObject, attributes);
        }
        catch (error) {
            console.log(error);
            next(error);
        }
    };
    return function (req, next) {
        _assessRequestParameters(req, next);
    };
};
const resetCompetitionParameters = _resetPlaceholderParameters(competitionParameters);
const competitionParameterPlaceholder = function () {
    return {
        parameters: competitionParameters,
        reset: resetCompetitionParameters
    };
};
exports.competitionParameterPlaceholder = competitionParameterPlaceholder;
const resetPlayerParameters = _resetPlaceholderParameters(playerParameters);
const playerParameterPlaceholder = function () {
    return {
        parameters: playerParameters,
        reset: resetPlayerParameters
    };
};
exports.playerParameterPlaceholder = playerParameterPlaceholder;
const resetTeamParameters = _resetPlaceholderParameters(teamParameters);
const teamParameterPlaceholder = function () {
    return {
        parameters: teamParameters,
        reset: resetTeamParameters
    };
};
exports.teamParameterPlaceholder = teamParameterPlaceholder;
exports.getCompetitionParameters = _syncParameters(competitionParameters);
exports.getPlayerParameters = _syncParameters(playerParameters);
exports.getTeamParameters = _syncParameters(teamParameters);
