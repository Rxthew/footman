import { DataTypes} from "sequelize";
import { sequelize } from "../app";
import  Competition  from "./competition";
import TeamsCompetitions  from "./teamscompetitions";
import  Player  from "./player";



const Team = sequelize.define('Team',{
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
})


Team.hasMany(Player)
Team.belongsToMany(Competition,{through: TeamsCompetitions})

export default Team