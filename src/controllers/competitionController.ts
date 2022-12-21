
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, renderers, seeCompetitionResults, syncAttributes, transactionWrapper } from './helpers';
import  Competition from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';


const seeCompetitionAttributes = function(){
      return attributesPlaceholders.seeCompetition
}
const seeCompetitionRenderer = renderers.seeCompetition
let seeCompetitionResults: seeCompetitionResults = {
      name: ''
}

const seeCompetitionCb = async function (t:Transaction): Promise<void>{
      
      const seeCompetitionQuery = async function(){ 
            const attributes = seeCompetitionAttributes()
            const competition = await Competition.findOne({
                  where: {
                        name: attributes.name,
                        code: attributes.code
                  },
                  transaction: t
                  });
            const teams = await (competition as any)?.getTeams({joinTableAttributes: ['season','points','ranking']})
            return {
                  competition,
                  teams,
            }

      }
      const results = await seeCompetitionQuery()
      
      const populateSeeCompetitionResults = function(){
            if(results.competition && results.teams){ 
                  Object.assign(seeCompetitionResults, results.competition.get(), {teams: results.teams.get()});   
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

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

      const attributes = syncAttributes()
      attributes.getSeeCompetitionAttributes(req,next)
      
      await transactionWrapper(seeCompetitionCb)
      seeCompetitionRenderer(res,seeCompetitionResults)
      
      return 
}




  
  