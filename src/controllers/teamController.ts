
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { getTeamParameters, teamParameterPlaceholder } from './helpers/parameters';
import * as queryHelpers from './helpers/queries';
import * as renderers  from './helpers/renderers';
import * as resultsGenerator from './helpers/results';
import * as validators from './helpers/validators';
import  Team from '../models/team';
import { Transaction } from 'sequelize';
import '../models/concerns/_runModels';
import Competition, { CompetitionModel } from '../models/competition';



const { 
      preFormCreateTeamRenderer,
      preFormUpdateTeamRenderer, 
      seeTeamRenderer

} = renderers;

const {createTeamValidator, updateTeamValidator} = validators;

let preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
let postFormCreateTeamResults = resultsGenerator.postFormCreateTeam();
let preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
let postFormUpdateTeamResults = resultsGenerator.postFormUpdateTeam();
let seeTeamResults = resultsGenerator.seeTeam();
const transactionWrapper = queryHelpers.transactionWrapper;

const seeTeamCb = async function (t:Transaction): Promise<void>{

      const {getAllCompetitionNames, getAllCompetitionUrlParams, getAllPlayerUrlParams} = queryHelpers;
      
      const seeTeamQuery = async function(){ 

            const sortTeamData = function(arrayData: any[] | undefined){
                  arrayData = arrayData && arrayData.length > 0 ? arrayData.sort() : arrayData
            };

            const parameters = teamParameterPlaceholder().parameters;
            const team = await Team.findOne({
                  where: {
                        name: parameters.name,
                        code: parameters.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const playersResults = await (team as any)?.getPlayers({transaction: t}).catch(function(error:Error){
                  throw error
              }) 
            const competitionsResults = await (team as any)?.getCompetitions({joinTableAttributes: ['season','points','ranking']}, {transaction: t}).catch(function(error:Error){
                  throw error
              })
            let competitions = competitionsResults && competitionsResults.length > 0 ? getAllCompetitionNames(competitionsResults) : competitionsResults;
            let players = playersResults && playersResults.length > 0 ? (playersResults as any[]).map(player  => `${player.getDataValue('firstName')} ${player.getDataValue('lastName')}`) : playersResults;
            let competitionUrls = competitionsResults && competitionsResults.length > 0 ? getAllCompetitionUrlParams(competitionsResults,['name','code']) : competitionsResults;
            let playerUrls = playersResults && playersResults.length > 0 ? getAllPlayerUrlParams(playersResults,['firstName','lastName','code']) : competitionsResults;

            let sortedData = [competitions,players,competitionUrls,playerUrls]
            sortedData.map(data => sortTeamData(data))            
            
            return {
                  team,
                  players,
                  competitions,
                  competitionUrls,
                  playerUrls
            }

      }
      const results = await seeTeamQuery().catch(function(error:Error){
            throw error
        })
      
      const populateSeeTeamResults = function(){
            if(results.team && results.players && results.competitions ){
                  Object.assign(seeTeamResults, results.team.get(), {players: results.players}, {competitions: results.competitions}, {competitionUrls: results.competitionUrls}, {playerUrls: results.playerUrls});   
            }
            else{
                  const err = new Error('Query regarding team viewing returned invalid data.')
                  throw err

            }
      }

      try {
           populateSeeTeamResults()
      }
      catch(err){ 
            console.log(err);
            const newErr = new Error('Query regarding team viewing returned invalid data.');
            throw newErr
            
      }
 
      return  
    
  };

  

export const seeTeam = async function(req: Request, res: Response, next: NextFunction){

      getTeamParameters(req,next)
      
      await transactionWrapper(seeTeamCb,next).catch(function(error:Error){
            next(error)
        });
      seeTeamRenderer(res,seeTeamResults);

      teamParameterPlaceholder().reset();
      seeTeamResults = resultsGenerator.seeTeam();
      
      return 
}

const preFormCreateTeamCb = async function(t: Transaction){

      const {getAllCompetitions,getAllCompetitionNames} = queryHelpers;
      const getAllSeasons = queryHelpers.getSeasons
      const results = await getAllCompetitions(t).catch(function(error:Error){
            throw error
        });
      

      const populatePreFormCreateTeam = function(){
            if(results){
                  const competitions = getAllCompetitionNames(results);
                  Object.assign(preFormCreateTeamResults,{competitions: competitions}, {seasons: getAllSeasons()});
            }
            else{
                  const err = new Error('Query regarding team creation returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormCreateTeam()
       }
       catch(err){
             console.log(err)
             const newErr = new Error('Query regarding team creation returned invalid data.');
            throw newErr
       }
  
       return  

}

export const preFormCreateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      await transactionWrapper(preFormCreateTeamCb,next).catch(function(error:Error){
            next(error)
        });
      preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();

}

const postFormCreateTeamCb = async function(t:Transaction){


     const { nextCompetitionTemplate } = queryHelpers

      const getRelevantCompetitions = async function(){
           
            let competitionPromises:(() => Promise<CompetitionModel|null>)[] = [];
            const competitionNames = postFormCreateTeamResults.chosenCompetitions;
            const chosenSeason = postFormCreateTeamResults.season;
            if(competitionNames && competitionNames.length > 0 && chosenSeason){
                  for(let compName of competitionNames){
                        const nextPromise = async function(){
                              return await nextCompetitionTemplate(t,compName,chosenSeason).catch(function(err:Error){
                                    throw err;
                              })      
                        }
                        competitionPromises = [...competitionPromises, nextPromise] 
                  }
                  
                  
            }    
            return competitionPromises 
      };

      const createDissociatedTeam = async function(){
            const newTeam = await Team.create({...postFormCreateTeamResults}, {transaction: t}).catch(function(err:Error){throw err});
            return newTeam
      }

      const createTeam = async function(){

            const teamParameters = {...postFormCreateTeamResults};
            Object.assign(teamParameters, {chosenCompetitions: undefined});
            const chosenSeason = postFormCreateTeamResults.season;

            const competitionPromises = await getRelevantCompetitions().catch(function(err:Error){throw err});

            if(competitionPromises.length === 0){
                  return await createDissociatedTeam()

            }

            const relevantCompetitions = await Promise.all(competitionPromises.map(competitionPromise => competitionPromise())).catch(function(err:Error){throw err});

            const newTeam = await Team.create({...teamParameters},{transaction: t}).catch(function(err:Error){throw err});

            await (newTeam as any).setCompetitions(relevantCompetitions, {transaction: t, through: {season: chosenSeason}}).catch(function(err:Error){
                  throw err
            });
      }
            
      await createTeam().catch(function(err:Error){
            throw err;
      })

}

export const postFormCreateTeam =[...createTeamValidator(), async function(req: Request, res: Response, next: NextFunction):Promise<void>{
      
      const goToTeamPage = async function(){
            try{
            const latestCode = await Team.max('code').catch(function(error:Error){
                  throw error
              });
            const teamName = postFormCreateTeamResults.name;
            
            res.redirect(`/team/${teamName}.${latestCode}`)
            }
            catch(err){
                  if(err){
                        console.log(err)
                        return next(err)
                  }
            }
      }
      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormCreateTeamCb,next).catch(function(error:Error){
                  next(error) 
              });
            Object.assign(preFormCreateTeamResults, {errors: errors.mapped()},  req.body);
            preFormCreateTeamRenderer(res, preFormCreateTeamResults);
      }
      else{
            Object.assign(postFormCreateTeamResults, req.body);
            await transactionWrapper(postFormCreateTeamCb,next).catch(function(error:Error){
                  next(error)
              });
            await goToTeamPage().catch(function(error:Error){
                  next(error)
              }) 
            
      }

      preFormCreateTeamResults = resultsGenerator.preFormCreateTeam();
      postFormCreateTeamResults = resultsGenerator.postFormCreateTeam();

}]

const preFormUpdateTeamCb = async function(t: Transaction){

      const {getAllCompetitions,getAllCompetitionNames, getTeamSeason} = queryHelpers;
      const getSeasons = queryHelpers.getSeasons;

      const updateTeamQuery = async function(){


            const parameters = teamParameterPlaceholder().parameters;

            const competitions = await getAllCompetitions(t).catch(function(error:Error){
                  throw error
              });

            let competitionNames =  getAllCompetitionNames(competitions);
            
            const team = await Team.findOne({
                  where: {
                        name: parameters.name,
                        code: parameters.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
            });

            const teamCompetitions = team ? await (team as any).getCompetitions({transaction: t})
            .catch(function(error:Error){
                  throw error
            }) : []

            const chosenCompetitions = getAllCompetitionNames(teamCompetitions);
            const season = getTeamSeason(teamCompetitions);
            
            return {
                  chosenCompetitions,
                  competitionNames,
                  season,
                  team,
            }       
      }


      const results = await updateTeamQuery().catch(function(error:Error){
            throw error
        });
      

      const populatePreFormUpdateTeam = function(){
            if(results.team){
                  Object.assign(preFormUpdateTeamResults, results.team.get(), {competitions: results.competitionNames}, {chosenCompetitions: results.chosenCompetitions}, 
                  {season: results.season}, {seasons: getSeasons()}); 
            }
            else{
                  const err = new Error('Query regarding team update returned invalid data.')
                  throw err

            }  
      }

      try {
            populatePreFormUpdateTeam()
       }
       catch(err){
             console.log(err);
             const newErr = new Error('Query regarding team update returned invalid data.');
            throw newErr
       }
  
       return 

}

export const preFormUpdateTeam = async function(req: Request, res: Response, next: NextFunction):Promise<void>{
      getTeamParameters(req,next)

      await transactionWrapper(preFormUpdateTeamCb,next).catch(function(error:Error){
            next(error)
        }); 
      preFormUpdateTeamRenderer(res,preFormUpdateTeamResults);
      teamParameterPlaceholder().reset()
      preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
      
      return
}

const postFormUpdateTeamCb = async function(t:Transaction){
      
      const {nextCompetitionTemplate} = queryHelpers;

      const getRelevantCompetitions = async function(){
           
            let competitionPromises:(() => Promise<CompetitionModel|null>)[] = [];
            const competitionNames = postFormUpdateTeamResults.chosenCompetitions;
            const chosenSeason = postFormUpdateTeamResults.season;
            if(competitionNames && competitionNames.length > 0 && chosenSeason){
                  for(let compName of competitionNames){
                        const nextPromise = async function(){
                              return await nextCompetitionTemplate(t, compName,chosenSeason).catch(function(err:Error){
                                    throw err;
                              })      
                        }
                        competitionPromises = [...competitionPromises, nextPromise] 
                  }
                  
                  
            }    
            return competitionPromises 
      };

      const updateTeam = async function(){

            const previousParameters = teamParameterPlaceholder().parameters;
            const teamParameters = {...postFormUpdateTeamResults};
            Object.assign(teamParameters, {chosenCompetitions: undefined});
            const chosenSeason = postFormUpdateTeamResults.season;

            const competitionPromises = await getRelevantCompetitions().catch(function(err:Error){
                  throw err;
            });

            const relevantCompetitions = competitionPromises.length > 0 ?  await Promise.all(competitionPromises.map(competitionPromise => competitionPromise())).catch(function(err:Error){throw err}) : competitionPromises;

            const updatedTeam = await Team.findOne({
                  where: {
                        name: previousParameters.name,
                        code: previousParameters.code
                  },
                  include: [{
                        model: Competition,


                  }],
                  transaction: t
            }).catch(function(err:Error){throw err});

            updatedTeam?.set({...teamParameters});

            if(postFormUpdateTeamResults.chosenCompetitions && postFormUpdateTeamResults.season){
                  await (updatedTeam as any).setCompetitions(relevantCompetitions,{transaction: t, through: {season: chosenSeason}}).catch(function(err:Error){throw err});

            }
            else{
                  await (updatedTeam as any).setCompetitions(null, {transaction: t}).catch(function(error:Error){
                        throw error
                  })
            }

            await updatedTeam?.save().catch(function(err:Error){
                  throw err
            });

      }

      await updateTeam().catch(function(err:Error){
            throw err;
      })
     
}

export const postFormUpdateTeam = [...updateTeamValidator(), async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      getTeamParameters(req,next);
      const errors = validationResult(req);

      if(!errors.isEmpty()){

            await transactionWrapper(preFormUpdateTeamCb,next).catch(function(err){
                  next(err) 
            });
            Object.assign(preFormUpdateTeamResults, req.body, {errors: errors.mapped()});
            preFormUpdateTeamRenderer(res,preFormUpdateTeamResults);       

      }
      else{
            Object.assign(postFormUpdateTeamResults, req.body);
            await transactionWrapper(postFormUpdateTeamCb,next).catch(function(error:Error){
                  next(error)
              });
            const [name,code] = [postFormUpdateTeamResults.name, req.params.code];
            res.redirect(`/team/${name}.${code}`);

      }

      teamParameterPlaceholder().reset()
      preFormUpdateTeamResults = resultsGenerator.preFormUpdateTeam();
      postFormUpdateTeamResults = resultsGenerator.postFormUpdateTeam();
}]






  
  