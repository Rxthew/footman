import { competitionDataResults } from './results';
import { createHash } from 'crypto';

interface eventObjectType {
    [index:string] : ((...args:any[]) => any) | ((...args:any[]) =>any)[] 

};

interface dataIndexObj {
    hashes: string | null,
    data: string | null
};

interface dataIndexHandler {
    get(obj:dataIndexObj, prop:keyof dataIndexObj): string | null,
    set(obj:dataIndexObj, prop:keyof dataIndexObj, value: string | null): boolean
};


let dataIndexContainer: dataIndexObj = {
    hashes: null,
    data: null
}; 

const sendCompetitionSignals = function(eventObject: eventObjectType, eventKey: string | number, eventObjectParams:{[index:string] : ( any | any[])} | undefined){
    if(eventObjectParams){
          const params = eventObjectParams;
          if(params[eventKey] && eventObject[eventKey]){
                if(Array.isArray(eventObject[eventKey])){
                      const chosenFunctions = eventObject[eventKey] as ((...args:any[]) =>any)[];
                      chosenFunctions.map((fn,index) => fn(...params[eventKey].indexOf(index)));
                }
                else {
                      const chosenFunction = eventObject[eventKey] as (...args:any[])=>any;
                      chosenFunction(...params[eventKey])
                }
          }

          return
    }
    else{
          if(Array.isArray(eventObject[eventKey])){
                const chosenFunctions = eventObject[eventKey] as (() =>any)[];
                chosenFunctions.map((fn) => fn());
          }
          else{
                const chosenFunction = eventObject[eventKey] as ()=>any;
                chosenFunction();
          }
    }

};

const indexHandler:dataIndexHandler = {
    get(obj:dataIndexObj,prop:keyof dataIndexObj){
          return obj[prop]

    },
    set(obj:dataIndexObj, prop: keyof dataIndexObj, value: null | string){        
          if(typeof obj[prop] === 'string' || typeof obj[prop] === null){
                dataIndexContainer = Object.assign({}, obj, {[prop]: value});
                return true
          }
          else{
                throw new Error('This property can only be set to null or to a string')
          }
                     
    }

};

export const hashIndexData = function(parsedIndexData: competitionDataResults){
    const seasons = Object.keys(parsedIndexData);
    const hashes = {};
    for (let season of seasons){
          const hash = createHash('sha256');
          hash.update(JSON.stringify(parsedIndexData[season]));
          const hashedValue = hash.digest('base64');
          Object.assign(hashes, {season: hashedValue});
    }
    const stringifiedHashes = JSON.stringify(hashes);
    return stringifiedHashes

};

export const readIndexData = function(dataIndex:dataIndexObj=dataIndexContainer, handler=indexHandler){
    const indexData = new Proxy(dataIndex,handler);
    const {data} = indexData;
    if(data){
          const parsedData = JSON.parse(data);
          return parsedData
    }

};

export const readHashedIndexData = function(dataIndex:dataIndexObj=dataIndexContainer, handler=indexHandler){
    const indexData = new Proxy(dataIndex,handler);
    const {hashes} = indexData;
    if(hashes){
          const parsedData = JSON.parse(hashes);
          return parsedData
    }

};

export const writeIndexData = function(newData: competitionDataResults | null, dataIndex:dataIndexObj=dataIndexContainer, handler=indexHandler){
    const indexData = new Proxy(dataIndex, handler);
    indexData.data = newData ? JSON.stringify(newData) : newData;
    return dataIndex
};

export const writeHashedIndexData = function(stringifiedHashes:string | null, dataIndex:dataIndexObj=dataIndexContainer, handler=indexHandler){
    const indexData = new Proxy(dataIndex,handler);
    indexData.hashes = stringifiedHashes
    return dataIndex
}