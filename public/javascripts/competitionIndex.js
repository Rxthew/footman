
const getCompetitionIndexData = async function(datahash=''){
    try{
    const response = await fetch(`/competition/data/${datahash}`, {mode: 'cors'});
    if(response.ok){
        const indexData = response.json();
        return indexData
    }
    else{
        const err = new Error('Index data not available. Check your internet connection and try again.')
        throw err
    }
    }catch(err){
        throw err
    }
};

const addError = function(error){
    const errorContainer = document.createElement('div');
    const errorMessage = document.createElement('p');
    errorMessage.textContent = error;
    errorContainer.appendChild(errorMessage);
    return errorContainer
};

const addSingleCompetition = function(name,url){
    const container = document.createElement('div');
    const link = document.createElement('a');
    link.textContent = name;
    link.setAttribute('href', url);
    container.appendChild(link);
    return container

};

const addNewCompetitions = function(node,data){
    if(Array.isArray(data)){
        data.forEach(detail => {
         const competition = addSingleCompetition(detail.name,detail.url);
         node.appendChild(competition)
        })
    }
    else{
        const error = addError(data);
        node.appendChild(error)
    }
};

const removePriorData = function(node){
    const children = Array.from(node.children)
    if(children.length > 0){
        children.forEach(
            child => child.remove()
        )
    }

};

const refreshArticle = function(data){
    const article = document.querySelector('article');
    removePriorData(article);
    addNewCompetitions(article,data)
};


const toggleDataBySeason = async function(event){
    const options = Array.from(document.querySelectorAll('option'));
    if(options.includes(event.target)){
        if(event.target.dataset.hash){
            const hash = event.target.dataset.hash;
            const data = await getCompetitionIndexData(hash).catch(function(err){console.log(err); refreshArticle(err.message)});
            const season = event.target.value;
            const seasonData = data[season];
            refreshArticle(seasonData);
        }
    }
};

const addListeners = function(){
    const select = document.querySelector('select');
    select.addEventListener('click', toggleDataBySeason);
}
addListeners();
