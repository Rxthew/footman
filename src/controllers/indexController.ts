/* eslint-disable @typescript-eslint/no-explicit-any */
import * as queryHelpers from "./helpers/queries";
import * as resultsGenerator from "./helpers/results";
import { Request, Response, NextFunction } from "express";
import { Transaction } from "sequelize";
import Competition, { CompetitionModel } from "../models/competition";
import Player from "../models/player";
import Team, { TeamModel } from "../models/team";
import { seeHomepageRenderer } from "./helpers/renderers";

let seeHomepageResults = resultsGenerator.seeHomepage();
const { transactionWrapper } = queryHelpers;

const seeHomepageCb = async function (t: Transaction) {
  const seeHomepageQuery = async function () {
    const {
      getAllCompetitionUrlParams,
      getAllPlayerUrlParams,
      getAllTeamUrlParams,
      getFeaturedCompetitionUrls,
      getFeaturedPlayerUrls,
      getFeaturedTeamUrls,
      getAllDissociatedCompetitions,
      getAllDissociatedPlayers,
      getAllDissociatedTeams,
    } = queryHelpers;

    const getFeaturedUrls = async function () {
      const featuredCompetitionNames = ["English Premier League"];
      const featuredPlayerNames = [["Kevin", "De Bruyne"]];
      const featuredTeamNames = ["Manchester City"];

      const featuredCompetitionsUrls = await getFeaturedCompetitionUrls(
        t,
        featuredCompetitionNames
      ).catch((err: Error) => {
        throw err;
      });
      const featuredPlayersUrls = await getFeaturedPlayerUrls(
        t,
        featuredPlayerNames
      ).catch((err: Error) => {
        throw err;
      });
      const featuredTeamsUrls = await getFeaturedTeamUrls(
        t,
        featuredTeamNames
      ).catch((err: Error) => {
        throw err;
      });

      let featuredCompetitions: { name: string; url: string }[] = [];
      let featuredPlayers: { names: string[]; url: string }[] = [];
      let featuredTeams: { name: string; url: string }[] = [];

      featuredCompetitionsUrls &&
      featuredCompetitionNames.length === featuredCompetitionsUrls.length
        ? featuredCompetitionNames.forEach((competitionName, index) => {
            featuredCompetitions = [
              ...featuredCompetitions,
              { name: competitionName, url: featuredCompetitionsUrls[index] },
            ];
          })
        : featuredCompetitions;

      featuredPlayersUrls &&
      featuredPlayerNames.length === featuredPlayersUrls.length
        ? featuredPlayerNames.forEach((playerNames, index) => {
            featuredPlayers = [
              ...featuredPlayers,
              { names: playerNames, url: featuredPlayersUrls[index] },
            ];
          })
        : featuredPlayers;

      featuredTeamsUrls && featuredTeamNames.length === featuredTeamsUrls.length
        ? featuredTeamNames.forEach((teamName, index) => {
            featuredTeams = [
              ...featuredTeams,
              { name: teamName, url: featuredTeamsUrls[index] },
            ];
          })
        : featuredTeams;

      return {
        featuredCompetitions,
        featuredPlayers,
        featuredTeams,
      };
    };

    const getDissociatedUrls = async function () {
      const freeCompetitionModels = await getAllDissociatedCompetitions(
        t
      ).catch((err: Error) => {
        throw err;
      });
      const freePlayerModels = await getAllDissociatedPlayers(t).catch(
        (err: Error) => {
          throw err;
        }
      );
      const freeTeamModels = await getAllDissociatedTeams(t).catch(
        (err: Error) => {
          throw err;
        }
      );

      const competitionNames = freeCompetitionModels.map((competition) =>
        competition.getDataValue("name")
      );
      const playerNames = freePlayerModels.map((player) => [
        player.getDataValue("firstName"),
        player.getDataValue("lastName"),
      ]);
      const teamNames = freeTeamModels.map((team) => team.getDataValue("name"));

      const competitionUrls = getAllCompetitionUrlParams(
        freeCompetitionModels,
        ["name", "code"]
      );
      const playerUrls = getAllPlayerUrlParams(freePlayerModels, [
        "firstName",
        "lastName",
        "code",
      ]);
      const teamUrls = getAllTeamUrlParams(freeTeamModels, ["name", "code"]);

      let freeCompetitions: { name: string; url: string }[] = [];
      let freePlayers: { names: string[]; url: string }[] = [];
      let freeTeams: { name: string; url: string }[] = [];

      competitionNames.length === competitionUrls.length
        ? competitionNames.forEach((competitionName, index) => {
            freeCompetitions = [
              ...freeCompetitions,
              { name: competitionName, url: competitionUrls[index] },
            ];
          })
        : freeCompetitions;

      playerNames.length === playerUrls.length
        ? playerNames.forEach((allNames, index) => {
            freePlayers = [
              ...freePlayers,
              { names: allNames, url: playerUrls[index] },
            ];
          })
        : freePlayers;

      teamNames.length === teamUrls.length
        ? teamNames.forEach((teamName, index) => {
            freeTeams = [
              ...freeTeams,
              { name: teamName, url: teamUrls[index] },
            ];
          })
        : freeTeams;

      return {
        freeCompetitions,
        freePlayers,
        freeTeams,
      };
    };

    return {
      ...(await getFeaturedUrls()),
      ...(await getDissociatedUrls()),
    };
  };

  const results = await seeHomepageQuery().catch((err: Error) => {
    throw err;
  });

  const populateSeeHomepageResults = function () {
    if (
      results.featuredCompetitions &&
      results.featuredPlayers &&
      results.featuredTeams
    ) {
      Object.assign(
        seeHomepageResults,
        { featuredCompetitions: results.featuredCompetitions },
        { featuredPlayers: results.featuredPlayers },
        { featuredTeams: results.featuredTeams },
        {
          freeCompetitions: results.freeCompetitions,
          freePlayers: results.freePlayers,
          freeTeams: results.freeTeams,
        }
      );
    } else {
      const err = new Error("Query regarding homepage returned invalid data.");
      throw err;
    }
  };

  try {
    populateSeeHomepageResults();
  } catch (err) {
    console.log(err);
    const newErr = new Error("Query regarding homepage returned invalid data.");
    throw newErr;
  }

  return;
};

export const populateDatabaseWithDummyData = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const hardCodedData = function () {
    const teamsComp = {
      "English Premier League": [
        {
          name: "Manchester City",
          through: {
            points: 93,
            ranking: 1,
            season: "2021/22",
          },
        },

        {
          name: "Liverpool",
          through: {
            points: 92,
            ranking: 2,
            season: "2021/22",
          },
        },
      ],
    };

    const players = [
      {
        "Manchester City": [
          {
            firstName: "Kevin",
            lastName: "De Bruyne",
            age: 30,
            nationality: "Belgium",
            position: "Midfielder",
          },

          {
            firstName: "John",
            lastName: "Stones",
            age: 27,
            nationality: "England",
            position: "Defender",
          },

          {
            firstName: "Riyad",
            lastName: "Mahrez",
            age: 30,
            nationality: "Algeria",
            position: "Midfielder",
          },
        ],
      },

      {
        Liverpool: [
          {
            firstName: "Mohamed",
            lastName: "Salah",
            age: 29,
            nationality: "Egypt",
            position: "Forward",
          },

          {
            firstName: "Trent",
            lastName: "Alexander-Arnold",
            age: 23,
            nationality: "England",
            position: "Defender",
          },

          {
            firstName: "Virgil",
            lastName: "Van Dijk",
            age: 30,
            nationality: "Netherlands",
            position: "Defender",
          },
        ],
      },
    ];
    return {
      players,
      teamsComp,
    };
  };

  const checkForPremierLeague = async function () {
    const premierLeague = await Competition.findOne({
      where: {
        name: "English Premier League",
      },
    });
    return premierLeague ? true : false;
  };

  const populateDatabaseCb = async function (t: Transaction) {
    if (!(await checkForPremierLeague())) {
      const teamsComp = hardCodedData().teamsComp;

      const createCompetition = async function (compName: string) {
        const newCompetition: CompetitionModel = await Competition.create(
          {
            name: compName,
          },
          {
            include: [
              {
                model: Team,
              },
            ],
            transaction: t,
          }
        ).catch(function (err: Error) {
          throw err;
        });
        return newCompetition;
      };

      const implementCompetitionTeams = async function (
        competition: CompetitionModel,
        key: keyof typeof teamsComp
      ) {
        let competitionTeams: TeamModel[] = [];
        for (const team of teamsComp[key]) {
          const newTeam = await Team.create(
            { name: team.name },
            {
              include: [
                {
                  model: Competition,
                },
              ],
              transaction: t,
            }
          ).catch((err: Error) => {
            throw err;
          });
          await (newTeam as any).setCompetitions([competition], {
            transaction: t,
            through: {
              points: team.through.points,
              ranking: team.through.ranking,
              season: team.through.season,
            },
          });
          await newTeam.save({ transaction: t });
          competitionTeams = [...competitionTeams, newTeam];
        }
        return competitionTeams;
      };

      const createCompetitions = async function () {
        const competitions = Object.keys(teamsComp);
        for (const competition of competitions) {
          const newCompetition = await createCompetition(competition).catch(
            (err: Error) => {
              throw err;
            }
          );
          const competitionTeams = await implementCompetitionTeams(
            newCompetition,
            competition as keyof typeof teamsComp
          ).catch((err: Error) => {
            throw err;
          });
          await (newCompetition as any)
            .setTeams(competitionTeams, { transaction: t })
            .catch((err: Error) => {
              throw err;
            });
          await newCompetition.save({ transaction: t }).catch((err: Error) => {
            throw err;
          });
        }
      };

      const implementTeamPlayers = async function () {
        const teams = hardCodedData().players;
        for (const team of teams) {
          const teamKey = Object.keys(team)[0] as keyof typeof team;
          const playersTeam = await Team.findOne({
            where: {
              name: teamKey,
            },
            transaction: t,
          }).catch((err: Error) => {
            throw err;
          });
          const playersPromises = (team[teamKey] as any[]).map(
            (elem) => async () => {
              return await Player.create(
                { ...elem },
                { include: [{ model: Team }], transaction: t }
              ).catch((err: Error) => {
                throw err;
              });
            }
          );
          const players = await Promise.all(
            playersPromises.map((player) => player())
          ).catch((err: Error) => {
            throw err;
          });
          await (playersTeam as any)
            .setPlayers(players, { transaction: t })
            .catch((err: Error) => {
              throw err;
            });
          await playersTeam?.save({ transaction: t }).catch((err: Error) => {
            throw err;
          });
        }
      };

      await createCompetitions();
      await implementTeamPlayers();
    }
  };

  transactionWrapper(populateDatabaseCb, next);
  next();

  //checkForPremierLeague, if true return if false continue below      **yo this is without the transaction bit, so I need to factor that in later.
  // function bit like: for let object.keys hardcodeddata.teamscomp.
  //               const comp = competition.create({name: [key]})
  //               const compteams = []
  //               for let team of hardcodeddata.teamscomp[key]
  //                then -> const newTeam = Team.create({name: team.name})
  //                const teamsCompetitions = newTeam.getDataValue('TeamsCompetitions');
  //                teamsCompetitions.set('points',team.through.points);
  //                teamsCompetitions.set('ranking',team.through.ranking);
  //                teamsCompetitions.set('season',team.through.season);
  //                teamsCompetition.save()
  //                compTeams = [..compTeams, newTeam]
  //                end (Nested) for loop
  //                comp.setTeams(compteams)
  //                comp.save()
  //

  //next()
};

export const seeHomepage = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  await transactionWrapper(seeHomepageCb, next).catch(function (error: Error) {
    next(error);
  });

  if (seeHomepageResults) {
    seeHomepageRenderer(res, seeHomepageResults);
  }
  seeHomepageResults = resultsGenerator.seeHomepage();
};
