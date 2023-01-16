"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessTeamParameters = exports.assessPlayerParameters = exports.assessCompetitionParameters = exports.teamParameterPlaceholder = exports.playerParameterPlaceholder = exports.competitionParameterPlaceholder = void 0;
;
;
;
let competitionParameters = {
    name: '',
    code: undefined
};
let playerParameters = {
    firstName: '',
    lastName: '',
    code: undefined
};
let teamParameters = {
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
            let attributes = Object.assign({}, placeholderObject);
            for (let name of Object.keys(attributes)) {
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
const competitionParameterPlaceholder = function () {
    const resetCompetitionParameters = _resetPlaceholderParameters(competitionParameters);
    return {
        parameters: competitionParameters,
        reset: resetCompetitionParameters
    };
};
exports.competitionParameterPlaceholder = competitionParameterPlaceholder;
const playerParameterPlaceholder = function () {
    const resetPlayerParameters = _resetPlaceholderParameters(playerParameters);
    return {
        parameters: playerParameters,
        reset: resetPlayerParameters
    };
};
exports.playerParameterPlaceholder = playerParameterPlaceholder;
const teamParameterPlaceholder = function () {
    const resetTeamParameters = _resetPlaceholderParameters(teamParameters);
    return {
        parameters: teamParameters,
        reset: resetTeamParameters
    };
};
exports.teamParameterPlaceholder = teamParameterPlaceholder;
exports.assessCompetitionParameters = _syncParameters(competitionParameters);
exports.assessPlayerParameters = _syncParameters(playerParameters);
exports.assessTeamParameters = _syncParameters(teamParameters);
