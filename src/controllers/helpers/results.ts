export interface competitionDataResults {
    [index:string]: {name: string, url: string}[]
}

export interface seeHomepageResults{
    featuredCompetitions: {name: string, url: string}[],
    featuredPlayers: {names: string[], url:string}[],
    featuredTeams: {name: string, url: string}[]
};


export interface seePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string, 
    team?: string,
    age: number,
    position: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number,
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    code?: number
    teamUrl?: string
    

};

export interface seeTeamResults {
    name: string,
    players?: string[],
    competitions?: string[],
    code?: number,
    competitionUrls?: string[],
    playerUrls?: string[],
};

export interface seeCompetitionResults {
    name: string,
    teams?: string[],
    season?: string[],
    rankings?: number[]
    points?: number[],
    code?: number,
    teamUrls?: string[]
};

export interface seeCompetitionIndexResults {
    competitionDetails: {[index: string] :{ name: string, url: string}[]},
    seasons: string[]
};

export interface preFormCreatePlayerResults {
    teams: string[],
    seasons: string[],
    errors?: {[index: string]: string | number},
    firstName?: string,
    lastName?: string,
    nationality?: string,
    age?: number,
    position?: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number, 
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    team?: string,
    season?: string
    
};

export interface preFormCreateCompetitionResults {
    teams: string[],
    seasons: string[],
    name?: string,
    errors?: {[index: string]: string | number},
    chosenTeams?: string[],
    rankings?: number[],
    points?: number[],
    season?: string
};

export interface preFormCreateTeamResults {
    competitions: string[],
    seasons: string[],
    name?: string,
    errors?: {[index: string]: string | number},
    chosenCompetitions?: string[],
    season?: string
    
};

export interface postFormCreatePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string,
    age: number,
    position: string,
    goals?: number,
    assists?: number,
    speed?: number,
    strength?: number,
    attack?: number, 
    defense?: number,
    goalkeeping?: number,
    intelligence?: number,
    technique?: number,
    team?: string,
    season?: string,
    code?: number
    
};

export interface postFormCreateCompetitionResults {
    name: string,
    chosenTeams?: string[],
    rankings?: number[],
    points?: number[],
    season?: string,
    
};

export interface postFormCreateTeamResults {
    name: string,
    chosenCompetitions?: string[],
    season?: string
};

export interface preFormUpdatePlayerResults extends preFormCreatePlayerResults {
    firstName: string,
    lastName: string,
    nationality: string,
    age: number,
    position: string,
    code?: number
};

export interface postFormUpdatePlayerResults extends postFormCreatePlayerResults {};
export interface preFormUpdateTeamResults extends preFormCreateTeamResults {
    name: string,
    code?: number
};
export interface postFormUpdateTeamResults extends postFormCreateTeamResults {
    code?: number
};
export interface preFormUpdateCompetitionResults extends preFormCreateCompetitionResults {
    name: string,
    code?: number
};
export interface postFormUpdateCompetitionResults extends postFormCreateCompetitionResults {
    code?: number
};

export const competitionData = function():competitionDataResults{
    return {}
};

export const seeHomepage = function():seeHomepageResults{
    return{
        featuredCompetitions: [],
        featuredPlayers: [],
        featuredTeams: []
    }
};

export const preFormCreateCompetition = function():preFormCreateCompetitionResults{
    return {
        teams: [],
        seasons: []

    }
};

export const postFormCreateCompetition = function():postFormCreateCompetitionResults{
    return {
        name: ''
    }
};

export const preFormUpdateCompetition = function():preFormUpdateCompetitionResults{
    return {
        name: '',
        teams: [],
        seasons: []

    }

};

export const postFormUpdateCompetition = function():postFormUpdateCompetitionResults{
    return {
        name: '',
    }

};

export const seeCompetition = function():seeCompetitionResults{
    return {
        name: '',
    }

};

export const seeCompetitionIndex = function():seeCompetitionIndexResults{
    return {
        competitionDetails: {},
        seasons: []
    }

};

export const preFormCreatePlayer = function():preFormCreatePlayerResults{
    return {
        teams: [],
        seasons: [],     
    }
    
};

export const postFormCreatePlayer = function():postFormCreatePlayerResults{
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        age: 15,
        position: '',
  }

};

export const preFormUpdatePlayer = function():preFormUpdatePlayerResults{
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        position: '',
        age: 15,
        teams: [],
        seasons: []
    }
     
};

export const postFormUpdatePlayer = function():postFormUpdatePlayerResults{
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        age: 15,
        position: '',
  }

};

export const seePlayer = function():seePlayerResults{
    return {
        firstName: '',
        lastName: '',
        nationality: '',
        position: '',
        age: 15
    }

};

export const preFormCreateTeam = function():preFormCreateTeamResults{
    return {
        competitions: [],
        seasons: []
    }

};

export const postFormCreateTeam = function():postFormCreateTeamResults{
    return {
        name: ''
    }

};

export const preFormUpdateTeam = function():preFormUpdateTeamResults{
    return {
        name: '',
        competitions: [],
        seasons: []
    }

};

export const postFormUpdateTeam = function():postFormUpdateTeamResults{
    return {
        name: ''
    }

};

export const seeTeam = function():seeTeamResults{
    return {
        name: ''
    }

};



