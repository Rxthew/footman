
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, queryHelpers, renderers, seeTeamResults, syncAttributes, transactionWrapper } from './helpers';
import  Team from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';


const seeTeamAttributes = function(){
      return attributesPlaceholders.seeTeam
}
const seeTeamRenderer = renderers.seeTeam
let seeTeamResults: seeTeamResults = {
      name: ''
}

const seeTeamCb = async function (t:Transaction): Promise<void>{
      
      const seeTeamQuery = async function(){ 
            const attributes = seeTeamAttributes()
            const team = await Team.findOne({
                  where: {
                        name: attributes.name,
                        code: attributes.code
                  },
                  transaction: t
                  });
            const players = await (team as any)?.getPlayers() 
            const competitions = await (team as any)?.getCompetitions({joinTableAttributes: ['season','points','ranking']})
            return {
                  team,
                  players,
                  competitions,
            }

      }
      const results = await seeTeamQuery()
      
      const populateSeeTeamResults = function(){
            if(results.team && results.players && results.competitions ){ 
                  Object.assign(seeTeamResults, results.team.get(), {players: results.players.get()}, {competitions: results.competitions.get()});   
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }
      }

      try {
           populateSeeTeamResults()
      }
      catch(err){
            console.log(err)
      }
 
      return  
    
  };

export const seeTeam = async function(req: Request, res: Response, next: NextFunction){

      const attributes = syncAttributes()
      attributes.getSeeTeamAttributes(req,next)
      
      await transactionWrapper(seeTeamCb)
      seeTeamRenderer(res,seeTeamResults)
      
      return 
}

const preFormCreateTeamCb = async function(t: Transaction){

      const getAllSeasons = queryHelpers.getAllSeasons;
      const getAllCompetitions = queryHelpers.getAllCompetitions;
      const getAllCompetitionNames = queryHelpers.getAllCompetitionnames;

      const results = getAllCompetitions(t)

      const populatePreFormCreateTeam = async function(){
            if(results){
                  const competitions = getAllCompetitionnames();
                  const seasons = getAllSeasons()
                  Object.assign(preFormCreateTeamResults,{competitions: competitions}, {seasons: seasons})
            }
            else{
                  const err = new Error('Query returned invalid data.')
                  throw err

            }
      }

      try {
            populatePreFormCreateTeam()
       }
       catch(err){
             console.log(err)
       }
  
       return  

}

export const preFormCreateTeam = async function(){

}




  
  