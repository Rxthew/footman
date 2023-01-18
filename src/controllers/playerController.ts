
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { assessPlayerParameters,playerParameterPlaceholder } from './helpers/parameters';
import * as queryHelpers from './helpers/queries';
import * as renderers  from './helpers/renderers';
import * as validators from './helpers/validators';
import * as resultsGenerator from './helpers/results';
import  Player from '../models/player';
import { Transaction } from 'sequelize'
import  Team  from '../models/team';
import '../models/concerns/_runModels';
import Competition from '../models/competition';


const seePlayerRenderer = renderers.seePlayer;
const preFormCreatePlayerRenderer = renderers.preFormCreatePlayer;
const preFormUpdatePlayerRenderer = renderers.preFormUpdatePlayer;

const submitPlayerValidator = validators.postFormPlayer;

let seePlayerResults = resultsGenerator.seePlayer();
let preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
let postFormCreatePlayerResults = resultsGenerator.postFormCreatePlayer();
let preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
let postFormUpdatePlayerResults = resultsGenerator.postFormCreatePlayer();
const transactionWrapper = queryHelpers.transactionWrapper;


const seePlayerCb = async function (t:Transaction): Promise<void>{
      
      const seePlayerQuery = async function(){
            const parameters = playerParameterPlaceholder().parameters
            const player = await Player.findOne({
                  where: {
                        firstName: parameters.firstName,
                        lastName: parameters.lastName,
                        code: parameters.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const team = await (player as any)?.getTeam().catch(function(error:Error){
                  throw error
              })
            return {
                  player,
                  team
            }

      }
      const results = await seePlayerQuery().catch(function(error:Error){
            throw error
        })
      
      const populateSeePlayerResults = function(){
            if(results.player){ 
                  Object.assign(seePlayerResults, results.player.get());
                  if(results.team){
                        Object.assign(seePlayerResults, {team: results.team.getDataValue('name')})
      
                  };                  
            }
            
            else{
                  const err = new Error('Query regarding player viewing returned invalid data.')
                  throw err

            }
      }

      try {
           populateSeePlayerResults()
      }
      catch(err){
            console.log(err)
      }
 
      return  
    
  };

export const seePlayer = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      assessPlayerParameters(req,next)
      
      await transactionWrapper(seePlayerCb,next).catch(function(error:Error){
            next(error)
        });
      seePlayerRenderer(res,seePlayerResults);

      playerParameterPlaceholder().reset()
      seePlayerResults = resultsGenerator.seePlayer();
      
      return 
}


const preFormCreatePlayerCb = async function(t: Transaction): Promise<void>{

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamsWithCompetitions = queryHelpers.getAllTeamsWithCompetitions;
      const getAllTeamNames = queryHelpers.getAllTeamNames;
      const getAllSeasons = queryHelpers.getAllSeasons;

      const results = await getAllTeams(t).catch(function(error:Error){
            throw error
        })

      const populatePreFormCreatePlayer = function(){
            if(results){
                  const associatedTeams = getAllTeamsWithCompetitions(results);
                  const teams = getAllTeamNames(associatedTeams);
                  const seasons = getAllSeasons(results, 'team'); 
                  Object.assign(preFormCreatePlayerResults, {teams: teams}, {seasons: seasons});                 
            }
            else{
                  const err = new Error('Query regarding player creation returned invalid data.')
                  throw err

            }
      }

      try {
           populatePreFormCreatePlayer()
      }
      catch(err){
            console.log(err)
      }
 
      return  
}


export const preFormCreatePlayer = async function(req: Request, res: Response, next: NextFunction):Promise<void>{
      
      await transactionWrapper(preFormCreatePlayerCb,next).catch(function(error:Error){
            next(error)
        });
      preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
      preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();

      return

}


const postFormCreatePlayerCb = async function(t: Transaction): Promise<void>{


      const getTeam = async function(){
            const team = await Team.findOne({
                  where: {
                        name: postFormCreatePlayerResults.team,
                  },
                  include: {
                        model: Competition,
                        through: {
                              where: {
                                    season: postFormCreatePlayerResults.season
                              }
                        }
                  },
                  transaction: t
            }).catch(function(error:Error){
                  throw error
              })
            
            return team
      }

      
      const createPlayer = async function(){
            const playerParameters = {...postFormCreatePlayerResults};
            Object.assign(playerParameters, {team: undefined}, {season: undefined});
            
            const newPlayer = await Player.create({
                  ...playerParameters
                   },{transaction: t}).catch(function(error:Error){
                        throw error
                    }); 

            if(postFormCreatePlayerResults.team && postFormCreatePlayerResults.season){
                  const team = await getTeam().catch(function(error:Error){
                        throw error
                    })
                  await (newPlayer as any).setTeam(team, {transaction: t}).catch(function(error:Error){
                        throw error
                    })

            }
            
      }

      await createPlayer().catch(function(err:Error){
            throw err
      })
       
}


export const postFormCreatePlayer = [...submitPlayerValidator(), async function(req: Request, res: Response, next: NextFunction){
      
      const goToPlayerPage = async function(){
            try{
            const latestCode = await Player.max('code').catch(function(error:Error){
                  throw error
              });
            const firstName = postFormCreatePlayerResults.firstName;
            const lastName = postFormCreatePlayerResults.lastName;
            
            res.redirect(`/player/${firstName}.${lastName}.${latestCode}`)
            }
            catch(err){
                  if(err){
                        console.log(err)
                        return next(err)
                  }
            }
      };

      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormCreatePlayerCb,next).catch(function(error:Error){
                  next(error)
              });
            Object.assign(preFormCreatePlayerResults, {errors: errors.mapped()}, req.body);
            preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
      }
      else{
            Object.assign(postFormCreatePlayerResults, req.body);
            await transactionWrapper(postFormCreatePlayerCb,next).catch(function(error:Error){
                  next(error)
              });
            await goToPlayerPage().catch(function(error:Error){
                  next(error)
              }) 
            
      }

      preFormCreatePlayerResults = resultsGenerator.preFormCreatePlayer();
      postFormCreatePlayerResults = resultsGenerator.postFormCreatePlayer();

}]

const preFormUpdatePlayerCb = async function(t: Transaction){

      const getAllTeams = queryHelpers.getAllTeams;
      const getAllTeamsWithCompetitions = queryHelpers.getAllTeamsWithCompetitions;
      const getAllTeamNames = queryHelpers.getAllTeamNames;
      const getAllSeasons = queryHelpers.getAllSeasons;

      const allTeams = await getAllTeams(t).catch(function(error:Error){
            throw error
        })
      
      const allAssociatedTeams = getAllTeamsWithCompetitions(allTeams);

      const updatePlayerQuery = async function(){
            const parameters = playerParameterPlaceholder().parameters
            const player = await Player.findOne({
                  where: {
                        firstName: parameters.firstName,
                        lastName: parameters.lastName,
                        code: parameters.code
                  },
                  transaction: t
                  }).catch(function(error:Error){
                        throw error
                    });
            const team = await (player as any)?.getTeam({
                  include: [
                        {
                              model: Competition,
                              through: {attributes: ['season']}
                        }
                  ]
            }).catch(function(error:Error){
                  throw error
              })
            const teams = getAllTeamNames(allAssociatedTeams);
            const seasons = getAllSeasons(allTeams, 'team');
            const season = team.competitions[0]['TeamsCompetitions'].get('season');
            return {
                  player,
                  team,
                  teams,
                  seasons,
                  season
            }

      }
      const results = await updatePlayerQuery().catch(function(error:Error){
            throw error
        });
      
      const populatePreFormUpdatePlayer = function(){
            if(results.player && results.teams && results.seasons ){ 
                  Object.assign(preFormUpdatePlayerResults, results.player.get(), {teams: results.teams}, {seasons: results.seasons});
                  if(results.team && results.season){
                        Object.assign(preFormUpdatePlayerResults, {team: results.team.getDataValue('name')}, {season: results.season} )

                  }       
                            
            }
            else{
                  const err = new Error('Query regarding player update returned invalid data.')
                  throw err

            }
      }

      try {
            populatePreFormUpdatePlayer()
       }
       catch(err){
             console.log(err)
       }
  
       return  

}

export const preFormUpdatePlayer = async function(req: Request, res: Response, next: NextFunction):Promise<void>{

      assessPlayerParameters(req,next);
      
      
      await transactionWrapper(preFormUpdatePlayerCb,next).catch(function(error:Error){
            next(error)
        }); 
      preFormUpdatePlayerRenderer(res,preFormUpdatePlayerResults);
      playerParameterPlaceholder().reset()
      preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
      
      return

}


const postFormUpdatePlayerCb = async function(t: Transaction): Promise<void>{

      const getTeam = async function(){
            const team = await Team.findOne({
                  where: {
                        name: postFormCreatePlayerResults.team,
                  },
                  include: {
                        model: Competition,
                        through: {
                              where: {
                                    season: postFormCreatePlayerResults.season
                              }
                        }
                  },
                  transaction: t
            }).catch(function(error:Error){
                  throw error
              })
            
            return team
      }

      
      const updatePlayer = async function(){
            const playerParameters = {...postFormUpdatePlayerResults};
            Object.assign(playerParameters, {team: undefined}, {season: undefined});
            const updatedPlayer = await Player.update({
                  ...playerParameters
                   },{where: {code: postFormUpdatePlayerResults.code}, transaction: t}).catch(function(error:Error){
                        throw error
                    }); 

            if(postFormUpdatePlayerResults.team && postFormUpdatePlayerResults.season){
                  const team = await getTeam().catch(function(error:Error){
                        throw error
                    })
                  await (updatedPlayer as any).setTeam(team, {transaction: t}).catch(function(error:Error){
                        throw error
                    })

            }
            else{
                  await (updatedPlayer as any).setTeam(null, {transaction: t}).catch(function(error:Error){
                        throw error
                  })
            }
            
      }

      await updatePlayer().catch(function(err){
            throw err
      })
       
}



export const postFormUpdatePlayer = [...submitPlayerValidator(), async function(req: Request, res: Response, next:NextFunction): Promise<void>{

      Object.assign(postFormUpdatePlayerResults,{code: req.params.code});

      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormUpdatePlayerCb,next).catch(function(error:Error){
                  next(error)
              });
            Object.assign(preFormUpdatePlayerResults, req.body, {errors: errors.mapped()});
            preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);

      }
      else{
            Object.assign(postFormUpdatePlayerResults,req.body);
            await transactionWrapper(postFormUpdatePlayerCb,next).catch(function(error:Error){
                  next(error)
              });
            const [firstName,lastName,code] = [postFormUpdatePlayerResults.firstName, postFormUpdatePlayerResults.lastName, postFormUpdatePlayerResults.code];
            res.redirect(`/player/${firstName}.${lastName}.${code}`);
      }
      
      preFormUpdatePlayerResults = resultsGenerator.preFormUpdatePlayer();
      postFormUpdatePlayerResults = resultsGenerator.postFormCreatePlayer();

}]

  
  