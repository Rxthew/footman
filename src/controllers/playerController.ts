
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { attributesPlaceholders, postFormCreatePlayerResults, preFormCreatePlayerResults, renderers, resultsGenerator, seePlayerResults, syncAttributes, transactionWrapper, validators } from './helpers';
import  Player from '../models/player';
import { Transaction } from 'sequelize'
import  Team  from '../models/team';
import '../models/concerns/_runModels';
import Competition from '../models/competition';



let seePlayerAttributes = function(){
      return attributesPlaceholders.seePlayer
};



const seePlayerRenderer = renderers.seePlayer;
const preFormCreatePlayerRenderer = renderers.preFormCreatePlayer;

const createPlayerValidator = validators().postFormCreatePlayer;



let seePlayerResults: seePlayerResults = resultsGenerator().seePlayer;
let preFormCreatePlayerResults: preFormCreatePlayerResults = resultsGenerator().preFormCreatePlayer;
let postFormCreatePlayerResults: postFormCreatePlayerResults = resultsGenerator().postFormCreatePlayer;


const seePlayerCb = async function (t:Transaction): Promise<void>{
      
      const seePlayerQuery = async function(){
            const attributes = seePlayerAttributes()
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
            if(results.player && results.team ){ 
                  Object.assign(seePlayerResults, results.player.get(), {teamName: results.team.getDataValue('name')});                  
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
      seePlayerResults = resultsGenerator().seePlayer
      
      return 
}


const preFormCreatePlayerCb = async function(t: Transaction): Promise<void>{

      const getAllTeams = async function(){
            const teams = await Team.findAll({
                  include: [{
                        model: Competition,
                        through: {
                              attributes: ['season']
                        }
                  }],
                  transaction: t
            })
            return teams
      }

      const results = await getAllTeams()

      const getAllTeamNames = async function(){
            const names = results.filter(team => team.getDataValue('name'))
            const uniqueNames = Array.from(new Set(names))
            return uniqueNames
      }

      const getAllSeasons = async function(){
            const competitions = results.filter(team => team.competitions).flat() 
            const seasons = (competitions as any[]).map(competition => competition['TeamsCompetitions'].season) 
            const uniqueSeasons = Array.from(new Set(seasons))
            return uniqueSeasons
      }
      

      const populatePreFormCreatePlayer = function(){
            if(results){
                  const teams = getAllTeamNames();
                  const seasons = getAllSeasons(); 
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
                  await (newPlayer as any).addTeam(team, {transaction: t})

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

      createPlayerValidator();
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

      postFormCreatePlayerResults = resultsGenerator().postFormCreatePlayer;

      
}




  
  