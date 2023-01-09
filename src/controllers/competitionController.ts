
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, renderers, resetPlaceholderAttributes, resultsGenerator, seeCompetitionResults, syncAttributes, transactionWrapper } from './helpers';
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

const seeCompetitionRenderer = renderers.seeCompetition;
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




  
  