import { NextFunction, Request } from 'express'

interface competitionParametersType {
    name: string,
    code?: number,
    [index: string] : string | number | undefined 

};

 interface playerParametersType {
        firstName: string,
        lastName: string,
        code?: number,
        [index: string] : string | number | undefined 
};

 interface teamParametersType{
    name: string,
    code?: number,
    [index: string] : string | number | undefined 

};


let competitionParameters: competitionParametersType = {
    name: '',
    code: undefined

};

let playerParameters: playerParametersType = {
    firstName: '',
    lastName: '',
    code: undefined

};

let teamParameters: teamParametersType = {
    name: '',
    code: undefined

};


const _resetPlaceholderParameters = function<T extends {}>(obj:T){
    const placeholders = Object.assign({},obj);
    const resetAttributes = function(){
        Object.assign(obj, placeholders) 
    }
    return resetAttributes
};


const _syncParameters = function(placeholderObject:competitionParametersType | playerParametersType | teamParametersType){

    const _emptyResultHandler = function(value: string | number | undefined): Error | null{
        const error = new Error('Something went wrong when fetching the requested details.');
        const throwError = () => { throw error }
        return value === '' || value === undefined ? throwError() : null
    };

    const _assessRequestParameters = function(req: Request, next: NextFunction,): void{
        try {           
            let attributes = Object.assign({},placeholderObject)                     
            for(let name of Object.keys(attributes)){
                attributes[name] = req.params[name] ? req.params[name] : attributes[name]
                _emptyResultHandler(typeof attributes[name] === undefined ? attributes[name] : attributes[name]?.toString())                       
            }
            Object.assign(placeholderObject, attributes)
            
        }
        catch(error){
            console.log(error)
            next(error)
        }

    }

    return function(req: Request, next: NextFunction,){
        _assessRequestParameters(req, next)
    }
    
}

export const competitionParameterPlaceholder = function(){
    const resetCompetitionParameters = _resetPlaceholderParameters(competitionParameters);
    return {
        parameters: competitionParameters,
        reset: resetCompetitionParameters
    }
}

export const playerParameterPlaceholder = function(){
    const resetPlayerParameters = _resetPlaceholderParameters(playerParameters);
    return {
        parameters: playerParameters,
        reset: resetPlayerParameters
    }
}

export const teamParameterPlaceholder = function(){
    const resetTeamParameters = _resetPlaceholderParameters(teamParameters);
    return {
        parameters: teamParameters,
        reset: resetTeamParameters
    }
}


export const getCompetitionParameters = _syncParameters(competitionParameters);
export const getPlayerParameters = _syncParameters(playerParameters);
export const getTeamParameters = _syncParameters(teamParameters);
