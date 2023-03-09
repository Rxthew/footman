import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "./concerns/initdb";
import Competition from "./competition";
import Team from "./team";

interface TeamsCompetitionsModel
  extends Model<
    InferAttributes<TeamsCompetitionsModel>,
    InferCreationAttributes<TeamsCompetitionsModel>
  > {
  id: string;
  teamId: string;
  competitionId: string;
  points: number | null;
  ranking: number | null;
  season: string;
}

const TeamsCompetitions = sequelize.define<TeamsCompetitionsModel>(
  "TeamsCompetitions",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamId: {
      type: DataTypes.UUID,
      references: {
        model: Team,
        key: "id",
      },
    },
    competitionId: {
      type: DataTypes.UUID,
      references: {
        model: Competition,
        key: "id",
      },
    },
    points: {
      type: DataTypes.INTEGER,
    },
    ranking: {
      type: DataTypes.INTEGER,
    },
    season: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "competitions_table",
  }
);

export default TeamsCompetitions;
