
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { attributesPlaceholders, postFormCreatePlayerResults, postFormUpdatePlayerResults, preFormCreatePlayerResults, preFormUpdatePlayerResults, queryHelpers, renderers, resetPlaceholderAttributes, resultsGenerator, seePlayerResults, syncAttributes, transactionWrapper, validators } from './helpers';
import  Player from '../models/player';
import { Transaction } from 'sequelize'
import  Team  from '../models/team';
import '../models/concerns/_runModels';
import Competition from '../models/competition';



let seePlayerAttributes = function(){
      const resetSeePlayer = resetPlaceholderAttributes(attributesPlaceholders.seePlayer)
      return {
            seePlayer: attributesPlaceholders.seePlayer,
            reset: resetSeePlayer
      }
};

const seePlayerRenderer = renderers.seePlayer;
const preFormCreatePlayerRenderer = renderers.preFormCreatePlayer;
const preFormUpdatePlayerRenderer = renderers.preFormUpdatePlayer;

const submitPlayerValidator = validators().postFormPlayer;



let seePlayerResults: seePlayerResults = resultsGenerator().seePlayer;
let preFormCreatePlayerResults: preFormCreatePlayerResults = resultsGenerator().preFormCreatePlayer;
let postFormCreatePlayerResults: postFormCreatePlayerResults = resultsGenerator().postFormCreatePlayer;
let preFormUpdatePlayerResults: preFormUpdatePlayerResults = resultsGenerator().preFormUpdatePlayer;
let postFormUpdatePlayerResults: postFormUpdatePlayerResults = resultsGenerator().postFormCreatePlayer;


const seePlayerCb = async function (t:Transaction): Promise<void>{
      
      const seePlayerQuery = async function(){
            const attributes = seePlayerAttributes().seePlayer
            const player = await Player.findOne({
                  where: {
                        firstName: attributes.firstName,
                        lastName: attributes.lastName,
                        code: attributes.code
                  },
                  transaction: t
                  });
            const team = await (player as any)?.getTeam()
            return {
                  player,
                  team
            }

      }
      const results = await seePlayerQuery()
      
      const populateSeePlayerResults = function(){
            if(results.player){ 
                  Object.assign(seePlayerResults, results.player.get());
                  if(results.team){
                        Object.assign(seePlayerResults, {teamName: results.team.getDataValue('name')})
      
                  };                  
            }
            
            else{
                  const err = new Error('Query returned invalid data.')
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

      const attributes = syncAttributes();
      attributes.getSeePlayerAttributes(req,next);
      
      await transactionWrapper(seePlayerCb);
      seePlayerRenderer(res,seePlayerResults);

      seePlayerAttributes().reset()
      seePlayerResults = resultsGenerator().seePlayer;
      
      return 
}


const preFormCreatePlayerCb = async function(t: Transaction): Promise<void>{

      const getAllTeams = queryHelpers.getAllTeams
      const getAllTeamNames = queryHelpers.getAllTeamNames
      const getAllSeasons = queryHelpers.getAllSeasons

      const results = await getAllTeams(t)

      const populatePreFormCreatePlayer = function(){
            if(results){
                  const teams = getAllTeamNames(results);
                  const seasons = getAllSeasons(results); 
                  Object.assign(preFormCreatePlayerResults, teams, seasons);                 
            }
            else{
                  const err = new Error('Query returned invalid data.')
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
      
      await transactionWrapper(preFormCreatePlayerCb);
      preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
      preFormCreatePlayerResults = resultsGenerator().preFormCreatePlayer;

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
            
            
                  })
            
            return team
      }

      
      const createPlayer = async function(){
            const playerParameters = {...postFormCreatePlayerResults};
            Object.assign(playerParameters, {team: undefined}, {season: undefined});
            
            const newPlayer = await Player.create({
                  ...playerParameters
                   },{transaction: t}); 

            if(postFormCreatePlayerResults.team && postFormCreatePlayerResults.season){
                  const team = await getTeam()
                  await (newPlayer as any).setTeam(team, {transaction: t})

            }
            
      }

      createPlayer()
       
}


export const postFormCreatePlayer = async function(req: Request, res: Response, next: NextFunction){
      
      const goToPlayerPage = async function(){
            try{
            const latestCode = await Player.max('code');
            const firstName = postFormCreatePlayerResults.firstName;
            const lastName = postFormCreatePlayerResults.lastName;
            
            res.redirect(`/player/${firstName}_${lastName}_${latestCode}`)
            }
            catch(err){
                  if(err){
                        console.log(err)
                        return next(err)
                  }
            }
      }

      submitPlayerValidator();
      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormCreatePlayerCb);
            Object.assign(preFormCreatePlayerResults, {errors: errors.mapped()},  {team: req.body.team}, {season: req.body.season});
            preFormCreatePlayerRenderer(res, preFormCreatePlayerResults);
      }
      else{
            Object.assign(postFormCreatePlayerResults, req.body);
            await transactionWrapper(postFormCreatePlayerCb);
            await goToPlayerPage() 
            
      }

      preFormCreatePlayerResults = resultsGenerator().preFormCreatePlayer;
      postFormCreatePlayerResults = resultsGenerator().postFormCreatePlayer;

}

const preFormUpdatePlayerCb = async function(t: Transaction){

      const getAllTeams = queryHelpers.getAllTeams
      const getAllTeamNames = queryHelpers.getAllTeamNames
      const getAllSeasons = queryHelpers.getAllSeasons

      const allTeams = await getAllTeams(t)

      const updatePlayerQuery = async function(){
            const attributes = seePlayerAttributes().seePlayer
            const player = await Player.findOne({
                  where: {
                        firstName: attributes.firstName,
                        lastName: attributes.lastName,
                        code: attributes.code
                  },
                  transaction: t
                  });
            const team = await (player as any)?.getTeam({
                  include: [
                        {
                              model: Competition,
                              through: {attributes: ['season']}
                        }
                  ]
            })
            const teams = getAllTeamNames(allTeams);
            const seasons = getAllSeasons(allTeams);
            const season = team.competitions[0]['TeamsCompetitions'].get('season');
            return {
                  player,
                  team,
                  teams,
                  seasons,
                  season
            }

      }
      const results = await updatePlayerQuery();
      
      const populatePreFormUpdatePlayer = function(){
            if(results.player && results.teams && results.seasons ){ 
                  Object.assign(preFormUpdatePlayerResults, results.player.get(), {teams: results.teams}, {seasons: results.seasons});
                  if(results.team && results.season){
                        Object.assign(preFormUpdatePlayerResults, {teamName: results.team.getDataValue('name')}, {season: results.season} )

                  }       
                            
            }
            else{
                  const err = new Error('Query returned invalid data.')
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
      const attributes = syncAttributes();
      attributes.getSeePlayerAttributes(req,next);
      
      
      await transactionWrapper(preFormUpdatePlayerCb); 
      preFormUpdatePlayerRenderer(res,preFormUpdatePlayerResults);
      seePlayerAttributes().reset()
      preFormUpdatePlayerResults = resultsGenerator().preFormUpdatePlayer;
      
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
            
            
                  })
            
            return team
      }

      
      const updatePlayer = async function(){
            const playerParameters = {...postFormUpdatePlayerResults};
            Object.assign(playerParameters, {team: undefined}, {season: undefined});
            const updatedPlayer = await Player.update({
                  ...playerParameters
                   },{where: {code: postFormUpdatePlayerResults.code}, transaction: t}); 

            if(postFormUpdatePlayerResults.team && postFormUpdatePlayerResults.season){
                  const team = await getTeam()
                  await (updatedPlayer as any).setTeam(team, {transaction: t})

            }
            
      }

      updatePlayer()
       
}



export const postFormUpdatePlayer = async function(req: Request, res: Response, next:NextFunction): Promise<void>{

      Object.assign(postFormUpdatePlayerResults,{code: req.params.code});
      submitPlayerValidator();

      const errors = validationResult(req);

      if(!errors.isEmpty()){
            await transactionWrapper(preFormUpdatePlayerCb);
            Object.assign(preFormUpdatePlayerResults, req.body, {errors: errors.mapped()});
            preFormUpdatePlayerRenderer(res, preFormUpdatePlayerResults);

      }
      else{
            Object.assign(postFormUpdatePlayerResults,req.body);
            await transactionWrapper(postFormUpdatePlayerCb);
            const [firstName,lastName,code] = [postFormUpdatePlayerResults.firstName, postFormUpdatePlayerResults.lastName, postFormUpdatePlayerResults.code];
            res.redirect(`/player/${firstName}_${lastName}_${code}`);
      }
      
      preFormUpdatePlayerResults = resultsGenerator().preFormUpdatePlayer;
      postFormUpdatePlayerResults = resultsGenerator().postFormCreatePlayer;

}

  
  