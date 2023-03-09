import { NextFunction, Request } from 'express'

interface competitionParametersType {
    name: string,
    code?: number,
    [index: string] : string | number | undefined 

}

 interface playerParametersType {
        firstName: string,
        lastName: string,
        code?: number,
        [index: string] : string | number | undefined 
}

 interface teamParametersType{
    name: string,
    code?: number,
    [index: string] : string | number | undefined 

}


const competitionParameters: competitionParametersType = {
    name: '',
    code: undefined

};

const playerParameters: playerParametersType = {
    firstName: '',
    lastName: '',
    code: undefined

};

const teamParameters: teamParametersType = {
    name: '',
    code: undefined

};


const _resetPlaceholderParameters = function<T extends object>(obj:T){
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
            const attributes = Object.assign({},placeholderObject)                     
            for(const name of Object.keys(attributes)){
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

const resetCompetitionParameters = _resetPlaceholderParameters(competitionParameters);
export const competitionParameterPlaceholder = function(){
    return {
        parameters: competitionParameters,
        reset: resetCompetitionParameters
    }
};

const resetPlayerParameters = _resetPlaceholderParameters(playerParameters);
export const playerParameterPlaceholder = function(){
    return {
        parameters: playerParameters,
        reset: resetPlayerParameters
    }
};

const resetTeamParameters = _resetPlaceholderParameters(teamParameters);
export const teamParameterPlaceholder = function(){
    return {
        parameters: teamParameters,
        reset: resetTeamParameters
    }
};


export const getCompetitionParameters = _syncParameters(competitionParameters);
export const getPlayerParameters = _syncParameters(playerParameters);
export const getTeamParameters = _syncParameters(teamParameters);
