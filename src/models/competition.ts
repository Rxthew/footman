import { DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import { sequelize } from "../app";
import Team from "./team";
import TeamsCompetitions from "./teamscompetitions";

interface CompetitionModel extends Model<InferAttributes<CompetitionModel>,InferCreationAttributes<CompetitionModel>>{
    id: string,
    name: string,
}

const Competition = sequelize.define<CompetitionModel>('Competition',{
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
}, {
    tableName: 'Competitions'
})


Competition.belongsToMany(Team,{through: TeamsCompetitions})

export default Competition