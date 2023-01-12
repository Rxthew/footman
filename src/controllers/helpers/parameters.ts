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


export let competitionParameters: competitionParametersType = {
    name: '',
    code: undefined

};

export let playerParameters: playerParametersType = {
    firstName: '',
    lastName: '',
    code: undefined

};

export let teamParameters: teamParametersType = {
    name: '',
    code: undefined

};


export const resetPlaceholderAttributes = function<T extends {}>(obj:T){
    const placeholders = Object.assign({},obj);
    const resetAttributes = function(){
        Object.assign(obj, placeholders) 
    }
    return resetAttributes
}

export const syncAttributes = function(){

    const _emptyResultHandler = function(value: string | number | undefined): Error | null{
        const error = new Error('Something went wrong when fetching the requested details.');
        const throwError = () => { throw error }
        return value === '' || value === undefined ? throwError() : null
    };

    const _assessRequestParameters = function(req: Request, next: NextFunction, placeholderObject:competitionParametersType | playerParametersType | teamParametersType): void{
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

    return {
        getSeePlayerAttributes: function(req: Request, next: NextFunction): void{
            _assessRequestParameters(req, next, playerParameters)
        },
        getSeeTeamAttributes: function(req: Request, next:NextFunction): void{
            _assessRequestParameters(req, next, teamParameters)
        },
        getSeeCompetitionAttributes: function(req: Request, next: NextFunction): void{
            _assessRequestParameters(req,next,competitionParameters)

        }
    }
    
}