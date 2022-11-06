import { DataTypes, InferAttributes,InferCreationAttributes,Model} from "sequelize";
import { sequelize } from "../app";
import  Competition  from "./competition";
import TeamsCompetitions  from "./teamscompetitions";
import  Player  from "./player";

interface TeamModel extends Model<InferAttributes<TeamModel>,InferCreationAttributes<TeamModel>>{
    id: string,
    name: string,
}

const Team = sequelize.define<TeamModel>('Team',{
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