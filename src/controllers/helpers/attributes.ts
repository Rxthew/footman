import { NextFunction, Request } from 'express'


interface attributePlaceholderType {
    seePlayer : {
        firstName: string,
        lastName: string,
        code?: number
        [index: string] : string | number | undefined 
    },
    seeTeam: {
        name: string,
        code?: number,
        [index: string] : string | number | undefined 
    },
    seeCompetition: {
        name: string,
        code?: number,
        [index: string] : string | number | undefined 
    },
    
    
   
}

export let attributesPlaceholders: attributePlaceholderType = { 
    seePlayer : {
        firstName: '',
        lastName: '',
        code: undefined
        
    },
    seeTeam: {
        name: '',
        code: undefined
    },
    seeCompetition: {
        name: '',
        code: undefined
    },
    
    

}

type placeholderKey = keyof attributePlaceholderType

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
    }

    const _assessRequestParameters = function(req: Request, next: NextFunction, placeholderProperty:placeholderKey): void{
        try {
            if(Object.prototype.hasOwnProperty.call(attributesPlaceholders, placeholderProperty)){           
                let attributes: attributePlaceholderType[placeholderKey] = Object.assign({},attributesPlaceholders[placeholderProperty ])                     
                for(let name of Object.keys(attributes)){
                    attributes[name] = req.params[name] ? req.params[name] : attributes[name]
                    _emptyResultHandler(typeof attributes[name] === undefined ? attributes[name] : attributes[name]?.toString())                       
                }
                Object.assign(attributesPlaceholders, {[placeholderProperty]: attributes})
            }
        }
        catch(error){
            console.log(error)
            next(error)
        }


    }

    return {
        getSeePlayerAttributes: function(req: Request, next: NextFunction): void{
            _assessRequestParameters(req, next, 'seePlayer')
        },
        getSeeTeamAttributes: function(req: Request, next:NextFunction): void{
            _assessRequestParameters(req, next, 'seeTeam')
        },
        getSeeCompetitionAttributes: function(req: Request, next: NextFunction): void{
            _assessRequestParameters(req,next,'seeCompetition')

        }
    }
    
}