
import { DataTypes, InferAttributes,InferCreationAttributes,Model} from "sequelize";
import { sequelize  } from "./concerns/initdb";
import { CompetitionModel } from "./competition";
import { PlayerModel } from "./player";


export interface TeamModel extends Model<InferAttributes<TeamModel>,InferCreationAttributes<TeamModel>>{
    id?: string,
    name: string,
    competitions?: CompetitionModel[],
    players?: PlayerModel[]
    
}

const Team = sequelize.define<TeamModel>('team',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
}, {
    tableName: 'teams'
})


export default Team

