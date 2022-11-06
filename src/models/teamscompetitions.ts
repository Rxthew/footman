import { DataTypes, InferAttributes, InferCreationAttributes, Model} from "sequelize";
import { sequelize } from "../app";
import Competition from "./competition";
import Team  from "./team";


interface TeamsCompetitionsModel extends Model<InferAttributes<TeamsCompetitionsModel>,InferCreationAttributes<TeamsCompetitionsModel>>{
    id: string,
    team_id: string,
    competition_id: string,
    points: number | null,
    season: string
}

const TeamsCompetitions = sequelize.define<TeamsCompetitionsModel>('TeamsCompetitions',{
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
    },
    team_id: {
        type: DataTypes.UUID,
        references: {
            model: Team,
            key: 'id'
        },
        allowNull: false        
    },
    competition_id: {
        type: DataTypes.UUID,
        references: {
            model: Competition,
            key: 'id'
        },
        allowNull: false        
    },
    points: {
        type: DataTypes.INTEGER
    },
    season: {
        type: DataTypes.STRING,
        allowNull: false
           
    }

}, {
    tableName: 'Competition_Table'
})


export default TeamsCompetitions