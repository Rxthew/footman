
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, preFormCreateCompetitionResults, queryHelpers, renderers, resetPlaceholderAttributes, resultsGenerator, seeCompetitionResults, syncAttributes, transactionWrapper } from './helpers';
import  Competition from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';


let seeCompetitionAttributes = function(){
      const resetSeeCompetition = resetPlaceholderAttributes(attributesPlaceholders.seeCompetition);
      return {
            seeCompetition: attributesPlaceholders.seeCompetition,
            reset: resetSeeCompetition
      }
      
};

const preFormCreateCompetitionRenderer = renderers.preFormCreateCompetition;
const seeCompetitionRenderer = renderers.seeCompetition;

let preFormCreateCompetitionResults: preFormCreateCompetitionResults = resultsGenerator().preFormCreateCompetition;
let seeCompetitionResults: seeCompetitionResults = resultsGenerator().seeCompetition;

const seeCompetitionCb = async function (t:Transaction): Promise<void>{
      
      const seeCompetitionQuery = async function(){ 
            const attributes = seeCompetitionAttributes().seeCompetition;
            const competition = await Competition.findOne({
                  where: {
                        name: attributes.name,
                        code: attributes.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const teams = await (competition as any)?.getTeams({joinTableAttributes: ['season','points','ranking']}).catch(function(error:Error){
                  throw error
              });
            return {
                  competition,
                  teams,
            }

      };
      const results = await seeCompetitionQuery().catch(function(error:Error){
            throw error
      });
      
      const populateSeeCompetitionResults = function(){
            if(results.competition && results.teams){ 
                  Object.assign(seeCompetitionResults, results.competition.get(), {teams: results.teams.get()});   
            }
            else{
                  const err = new Error('Query returned invalid data.');
                  throw err;

            }
      }

      try {
           populateSeeCompetitionResults()
      }
      catch(err){
            console.log(err)
      }
 
      return  
    
  };

export const seeCompetition = async function(req: Request, res: Response, next: NextFunction){

      const attributes = syncAttributes();
      attributes.getSeeCompetitionAttributes(req,next);
      
      await transactionWrapper(seeCompetitionCb).catch(function(error:Error){
            throw error
        });

      seeCompetitionRenderer(res,seeCompetitionResults);

      seeCompetitionAttributes().reset();
      seeCompetitionResults = resultsGenerator().seeCompetition;
      
      return 
}

const preFormCreateCompetitionCb = async function(t:Transaction){

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamNames = queryHelpers.getAllTeamNames;

      const results = await getAllTeams(t).catch(function(error:Error){
            throw error
        });
      

      const populatePreFormCreateCompetition = function(){
            if(results){
                  const teamNames = getAllTeamNames(results);
                  Object.assign(preFormCreateCompetitionResults,{teams: teamNames});
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormCreateCompetition()
       }
       catch(err){
             console.log(err)
       }
  
       return 
}

export const preFormCreateCompetition = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      await transactionWrapper(preFormCreateCompetitionCb).catch(function(error:Error){
            throw error
        });
      preFormCreateCompetitionRenderer(res, preFormCreateCompetitionResults);
      preFormCreateCompetitionResults = resultsGenerator().preFormCreateCompetition;
}






  
  