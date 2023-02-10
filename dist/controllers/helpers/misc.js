"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeHashedIndexData = exports.writeIndexData = exports.readHashedIndexData = exports.readIndexData = exports.hashIndexData = exports.sendCompetitionSignals = exports.dataIndexContainer = void 0;
const crypto_1 = require("crypto");
;
;
;
exports.dataIndexContainer = {
    hashes: null,
    data: null
};
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
const indexHandler = {
    get(obj, prop) {
        return obj[prop];
    },
    set(obj, prop, value) {
        if (typeof obj[prop] === 'string' || obj[prop] === null) {
            exports.dataIndexContainer = Object.assign({}, obj, { [prop]: value });
            return true;
        }
        else {
            throw new Error('This property can only be set to null or to a string');
        }
    }
};
const hashIndexData = function (parsedIndexData) {
    const seasons = Object.keys(parsedIndexData);
    const hashes = {};
    for (let season of seasons) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(JSON.stringify(parsedIndexData[season]));
        const hashedValue = hash.digest('base64');
        Object.assign(hashes, { [season]: hashedValue });
    }
    const stringifiedHashes = JSON.stringify(hashes);
    return stringifiedHashes;
};
exports.hashIndexData = hashIndexData;
const readIndexData = function (dataIndex = exports.dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    const { data } = indexData;
    if (data) {
        const parsedData = JSON.parse(data);
        return parsedData;
    }
};
exports.readIndexData = readIndexData;
const readHashedIndexData = function (dataIndex = exports.dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    const { hashes } = indexData;
    if (hashes) {
        const parsedData = JSON.parse(hashes);
        return parsedData;
    }
};
exports.readHashedIndexData = readHashedIndexData;
const writeIndexData = function (newData, dataIndex = exports.dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    indexData.data = newData ? JSON.stringify(newData) : newData;
    return dataIndex;
};
exports.writeIndexData = writeIndexData;
const writeHashedIndexData = function (stringifiedHashes, dataIndex = exports.dataIndexContainer, handler = indexHandler) {
    const indexData = new Proxy(dataIndex, handler);
    indexData.hashes = stringifiedHashes;
    return dataIndex;
};
exports.writeHashedIndexData = writeHashedIndexData;
