"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeHashedIndexData = exports.writeIndexData = exports.sendCompetitionSignals = exports.sequentialRankings = exports.readHashedIndexData = exports.readIndexData = exports.hashIndexData = void 0;
const crypto_1 = require("crypto");
let dataIndexContainer = {
    hashes: null,
    data: null
};
const indexHandler = {
    get(obj, prop) {
        return obj[prop];
    },
    set(obj, prop, value) {
        if (typeof obj[prop] === 'string' || obj[prop] === null) {
            dataIndexContainer = Object.assign({}, obj, { [prop]: value });
            return true;
        }
        else {
            throw new Error('This property can only be set to null or to a string');
        }
    }
};
const hashIndexData = function (parsedIndexData) {
    const _sanitiseHashString = function (hashString) {
        const hashStringArray = hashString.split('');
        const noDelimiterArray = hashStringArray.filter(character => character !== '.' && character !== '/');
        const sanitised = noDelimiterArray.join('');
        return sanitised;
    };
    const seasons = Object.keys(parsedIndexData);
    const hashes = {};
    for (const season of seasons) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(JSON.stringify(parsedIndexData[season]));
        const hashedValue = hash.digest('base64');
        const sanitisedValue = _sanitiseHashString(hashedValue);
        Object.assign(hashes, { [season]: sanitisedValue });
    }
    const stringifiedHashes = JSON.stringify(hashes);
    return stringifiedHashes;
};
exports.hashIndexData = hashIndexData;
const readIndexData = function (dataIndex = dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    const { data } = indexData;
    if (data) {
        const parsedData = JSON.parse(data);
        return parsedData;
    }
};
exports.readIndexData = readIndexData;
const readHashedIndexData = function (dataIndex = dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    const { hashes } = indexData;
    if (hashes) {
        const parsedData = JSON.parse(hashes);
        return parsedData;
    }
};
exports.readHashedIndexData = readHashedIndexData;
const sequentialRankings = function (valuesArray) {
    if (valuesArray) {
        const rankings = valuesArray.map(value => parseInt(value));
        if (rankings.some(value => value > rankings.length)) {
            const mapOldToNewValues = function () {
                const rankChange = new Map();
                const orderedRankings = [...rankings].sort(function (x, y) {
                    return x > y ? 1 : -1;
                });
                for (let largest = rankings.length; largest > 0; largest--) {
                    rankChange.set(orderedRankings.pop(), largest);
                }
                return rankChange;
            };
            const produceNewRankings = function (valuesMap) {
                let newRankings = [];
                for (let index = 0; index < rankings.length; index++) {
                    newRankings = [...newRankings, valuesMap.get(rankings[index])];
                }
                const newStringRanks = newRankings.map(ranking => ranking?.toString());
                return newStringRanks;
            };
            const oldToNewValuesMap = mapOldToNewValues();
            return produceNewRankings(oldToNewValuesMap);
        }
        return rankings;
    }
};
exports.sequentialRankings = sequentialRankings;
const sendCompetitionSignals = async function (eventObject, eventKey, eventObjectParams) {
    if (eventObjectParams) {
        const params = eventObjectParams;
        if (params[eventKey] && eventObject[eventKey]) {
            if (Array.isArray(eventObject[eventKey])) {
                const chosenFunctions = eventObject[eventKey];
                const chosenFunctionsPromises = chosenFunctions.map((fn, index) => async () => await fn(...params[eventKey].indexOf(index)));
                await Promise.all(chosenFunctionsPromises.map(promise => promise())).catch(function (err) { throw err; });
            }
            else {
                const chosenFunction = eventObject[eventKey];
                (async () => await chosenFunction(...params[eventKey]).catch(function (err) { throw err; }))();
            }
        }
        return;
    }
    else {
        if (Array.isArray(eventObject[eventKey])) {
            const chosenFunctions = eventObject[eventKey];
            const chosenFunctionsPromises = chosenFunctions.map((fn) => async () => await fn());
            await Promise.all(chosenFunctionsPromises.map(promise => promise())).catch(function (err) { throw err; });
        }
        else {
            const chosenFunction = eventObject[eventKey];
            (async () => await chosenFunction().catch(function (err) { throw err; }))();
        }
    }
};
exports.sendCompetitionSignals = sendCompetitionSignals;
const writeIndexData = function (newData, dataIndex = dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    indexData.data = newData ? JSON.stringify(newData) : newData;
    return dataIndex;
};
exports.writeIndexData = writeIndexData;
const writeHashedIndexData = function (stringifiedHashes, dataIndex = dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    indexData.hashes = stringifiedHashes;
    return dataIndex;
};
exports.writeHashedIndexData = writeHashedIndexData;
