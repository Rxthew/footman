
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, postFormCreateTeamResults, preFormCreateTeamResults, queryHelpers, renderers, resetPlaceholderAttributes, resultsGenerator, seeTeamResults, syncAttributes, transactionWrapper } from './helpers';
import  Team, { TeamModel } from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';
import Competition, { CompetitionModel } from '../models/competition';


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
let postFormCreateTeamResults: postFormCreateTeamResults = resultsGenerator().postFormCreateTeam;

const seeTeamCb = async function (t:Transaction): Promise<void>{
      
      const seeTeamQuery = async function(){ 
            const attributes = seeTeamAttributes().seeTeam
            const team = await Team.findOne({
                  where: {
                        name: attributes.name,
                        code: attributes.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const players = await (team as any)?.getPlayers().catch(function(error:Error){
                  throw error
              }) 
            const competitions = await (team as any)?.getCompetitions({joinTableAttributes: ['season','points','ranking']}).catch(function(error:Error){
                  throw error
              })
            return {
                  team,
                  players,
                  competitions,
            }

      }
      const results = await seeTeamQuery().catch(function(error:Error){
            throw error
        })
      
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
      
      await transactionWrapper(seeTeamCb).catch(function(error:Error){
            throw error
        });
      seeTeamRenderer(res,seeTeamResults);

      seeTeamAttributes().reset();
      seeTeamResults = resultsGenerator().seeTeam;
      
      return 
}

const preFormCreateTeamCb = async function(t: Transaction){

      const getAllCompetitions = queryHelpers.getAllCompetitions;
      const getAllCompetitionNames = queryHelpers.getAllCompetitionNames;
      const results = await getAllCompetitions(t).catch(function(error:Error){
            throw error
        });
      

      const populatePreFormCreateTeam = async function(){
            if(results){
                  const competitions = getAllCompetitionNames(results);
                  Object.assign(preFormCreateTeamResults,{competitions: competitions});
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

      await transactionWrapper(preFormCreateTeamCb).catch(function(error:Error){
            throw error
        });
      preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      preFormCreateTeamResults = resultsGenerator().preFormCreateTeam;

}

const postFormCreateTeamCb = async function(t:Transaction){


     const nextCompetitionTemplate = async function(season:string,competitionName:string){
            const nextCompetition = await Competition.findOne({
                  where: {
                        name: competitionName
                  },
                  include: {
                        model: Team,
                        through: {
                              where: {
                                    season: season
                              }
                        }

                  },
                  transaction: t
            }).catch(function(error:Error){
                  throw error
              })
            return nextCompetition
      }

      const allSeasons = async function(){

            const getAllCompetitions = queryHelpers.getAllCompetitions;
            const getAllTeams = queryHelpers.getAllTeams;
            const seasonsGenerator = function(comps: CompetitionModel[],teams: TeamModel[]){
                  return queryHelpers.seasonsGenerator(comps,teams)
            }

            const competitions = await getAllCompetitions(t).catch(function(error:Error){
                  throw error
              });
            const teams = await getAllTeams(t).catch(function(error:Error){
                  throw error
              });

            if(competitions || teams){
                  return seasonsGenerator(competitions, teams)
            }
            else{
                  const error = new Error('Query did not return valid data.')
                  throw(error)
            }
      }

      const getRelevantCompetitions = async function(){

            const seasons = await allSeasons().catch(function(err){
                  throw(err);
            });
           
            let competitionPromises:((() => Promise<CompetitionModel|null>)[])[] = [];
            const competitionNames = postFormCreateTeamResults.chosenCompetitions;
            if(competitionNames && competitionNames.length > 0){
                  for(let season of seasons){
                        let seasonCompetitions:(() => Promise<CompetitionModel | null>)[] = []
                        for(let compName of competitionNames){
                              const nextPromise = async function(){
                                   return await nextCompetitionTemplate(season,compName).catch(function(err:Error){
                                       throw err;
                                    })
                                    
                               } 
                        seasonCompetitions = [...seasonCompetitions, nextPromise]
                        }
                        competitionPromises = [...competitionPromises, seasonCompetitions]
                  }
            }    
            return competitionPromises 
      };
            
            
      const createTeams = async function(){

            const teamParameters = {...postFormCreateTeamResults};
            Object.assign(teamParameters, {chosenCompetitions: undefined});
            
            const promiseArrays = await getRelevantCompetitions().catch(function(err:Error){
                  throw err;
            }); 
            const relevantCompetitions = promiseArrays.map(async function(competitionPromises){
                  await Promise.all(competitionPromises).catch(function(err:Error){
                        throw err;
                  })
            });
            
            for (let competitionSet of relevantCompetitions){
                  const newTeam = await Team.create(
                        {...teamParameters},
                        {transaction: t}
                  ).catch(function(err:Error){
                        throw err
                  })

                  await (newTeam as any).setCompetitions(competitionSet, {transaction: t}).catch(function(err:Error){
                        throw err
                  })
            }
      }



      await createTeams().catch(function(err:Error){
            throw err;
      })

}




  
  