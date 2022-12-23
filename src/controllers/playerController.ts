
import { Request, Response, NextFunction } from 'express';
import { attributesPlaceholders, preFormCreatePlayerResults, renderers, seePlayerResults, syncAttributes, transactionWrapper } from './helpers';
import  Player from '../models/player';
import { Transaction } from 'sequelize'
import  Team  from '../models/team';
import '../models/concerns/_runModels';
import Competition from '../models/competition';



let seePlayerAttributes = function(){
      return attributesPlaceholders.seePlayer
};



const seePlayerRenderer = renderers.seePlayer;
const preFormCreatePlayerRenderer = renderers.preFormCreatePlayer


let seePlayerResults: seePlayerResults = {
      firstName: '',
      lastName: '',
      code: undefined
};
let preFormCreatePlayerResults: preFormCreatePlayerResults = {
      teams: [],
      seasons: []

};


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
            const team = await player?.getTeam()
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

      return

}




  
  