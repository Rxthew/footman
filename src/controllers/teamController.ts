
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, preFormCreateTeamResults, queryHelpers, renderers, resetPlaceholderAttributes, resultsGenerator, seeTeamResults, syncAttributes, transactionWrapper } from './helpers';
import  Team, { TeamModel } from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';
import { CompetitionModel } from '../models/competition';


let seeTeamAttributes = function(){
      const resetSeeTeam = resetPlaceholderAttributes(attributesPlaceholders.seeTeam)
      return {
            seeTeam: attributesPlaceholders.seeTeam,
            reset: resetSeeTeam
      }
};

const seeTeamRenderer = renderers.seeTeam;
const preFormCreateTeamRenderer = renderers.preFormCreateTeam;

let seeTeamResults: seeTeamResults = resultsGenerator().seeTeam;
let preFormCreateTeamResults:preFormCreateTeamResults = resultsGenerator().preFormCreateTeam;

const seeTeamCb = async function (t:Transaction): Promise<void>{
      
      const seeTeamQuery = async function(){ 
            const attributes = seeTeamAttributes().seeTeam
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

      const attributes = syncAttributes();
      attributes.getSeeTeamAttributes(req,next);
      
      await transactionWrapper(seeTeamCb);
      seeTeamRenderer(res,seeTeamResults);

      seeTeamAttributes().reset();
      seeTeamResults = resultsGenerator().seeTeam;
      
      return 
}

const preFormCreateTeamCb = async function(t: Transaction){

      const getAllCompetitions = queryHelpers.getAllCompetitions;
      const getAllCompetitionNames = queryHelpers.getAllCompetitionNames;
      const getAllTeams = queryHelpers.getAllTeams;
      const seasonsGenerator = function(comps: CompetitionModel[],teams: TeamModel[]){
            return queryHelpers.seasonsGenerator(comps,teams)
      }

      const results = await getAllCompetitions(t);
      const teams = await getAllTeams(t);

      const populatePreFormCreateTeam = async function(){
            if(results){
                  const competitions = getAllCompetitionNames(results);
                  const seasons =  seasonsGenerator(results, teams)
                  Object.assign(preFormCreateTeamResults,{competitions: competitions}, {seasons: seasons});
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

export const preFormCreateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      await transactionWrapper(preFormCreateTeamCb);
      preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      preFormCreateTeamResults = resultsGenerator().preFormCreateTeam;

}

const postFormCreateTeamCb = async function(t:Transaction){

}




  
  