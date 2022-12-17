import {checkAuthentication, sequelize} from './initdb';
import Competition from "../competition";
import Player from '../player';
import Team  from "../team";
import TeamsCompetitions from '../teamscompetitions';


checkAuthentication(sequelize);

Competition.belongsToMany(Team,{
    through: TeamsCompetitions,
    as: 'teams'
});
Player.belongsTo(Team,{
    foreignKey: 'teamId',
    as: 'team'
    });
Team.hasMany(Player);
Team.belongsToMany(Competition,{
    through: TeamsCompetitions,
    as: 'competitions'
});

(async()=>{
    await sequelize.sync()
})()




