import {checkAuthentication, sequelize} from './initdb';
import Competition from "../competition";
import Player from '../player';
import Team  from "../team";
import TeamsCompetitions from '../teamscompetitions';


checkAuthentication(sequelize);

Competition.belongsToMany(Team,{
    through: TeamsCompetitions,
    
});
Player.belongsTo(Team,{
    foreignKey: 'teamId',
    
    });
Team.hasMany(Player);
Team.belongsToMany(Competition,{
    through: TeamsCompetitions,
    
});

(async()=>{
    await sequelize.sync()
})()




