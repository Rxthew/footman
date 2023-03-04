const attachSubmitHandler = function(){
    const form = document.querySelector('form');
    form.addEventListener('submit',deleteProcess);
};

const attachUndoHandlers = function(undoContainer, intervalId, timeoutId){
    const undo = document.querySelector('#undo');
    const undoDeletion = function(){undoDelete(undoContainer)};
    const clear = function() {clearDeleteEffects(undoContainer,intervalId,timeoutId)};
    const redoSubmit = function(){attachSubmitHandler()};
    undo.addEventListener('click',undoDeletion);
    undo.addEventListener('click',redoSubmit)
    undo.addEventListener('click',clear);
    

};

const clearDeleteEffects = function(undoContainer,intervalId, timeoutId,){
    if(undoContainer.undo){
        const formContainer = document.querySelector('#formContainer');
        const loadingIndicator = document.querySelector('#loading');
        const undoButton = document.querySelector('#undo');
        const overlay = document.querySelector('.overlay');
        overlay.remove();
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        formContainer.classList.toggle('temporaryModal',false);
        loadingIndicator.remove();
        undoButton.remove();

    }
    return
};


const deleteProcess = function(event){
    event.preventDefault();
    const checkDelete = confirm('Are you sure you want to delete this item?')
    if(checkDelete){
        let undoObject = {undo: false};
        implementOverlay();
        setUpLoadingInterface();
        setUpUndoInterface();
        const interval = loadingInterval();
        const timeout = deleteTimeout(undoObject);
        attachUndoHandlers(undoObject,interval,timeout);
        removeSubmitHandler();
    }
};

const deleteTimeout = function(undoContainer){
    let deleteFlow = function(){
        if(undoContainer.undo){
            deleteFlow = null;
            return
        }
        else{
            const form = document.querySelector('form');
            form.submit();
            deleteFlow = null;
        }
    };
    const timeout = setTimeout(deleteFlow,10000);
    return timeout
};

const loadingInterval = function(){
    const deleting = document.querySelector('#deleting');
    const deletingText = deleting.textContent;
    const deletingLength = deletingText.length;
    const addPeriods = function(){
        if(deleting.textContent.length <= deletingLength + 2){
            deleting.textContent += '.';
        }
        else{
            deleting.textContent = deletingText + '.';
        }
    }
   const interval = setInterval(addPeriods,1000);
   return interval
};

const removeSubmitHandler = function(){
    const form = document.querySelector('form');
    form.removeEventListener('submit',deleteProcess);

};

const setUpUndoInterface = function(){
    const formContainer = document.querySelector('#formContainer');
    const undoButton = document.createElement('button');
    undoButton.id = 'undo';
    undoButton.textContent = 'Undo Delete';
    formContainer.appendChild(undoButton);
    formContainer.classList.toggle('temporaryModal',true);

};

const setUpLoadingInterface = function(){
    const formContainer = document.querySelector('#formContainer');
    const form = document.querySelector('form');
    const loading = document.createElement('div');
    const deleting = document.createElement('h3');
    loading.id = 'loading';
    deleting.id = 'deleting';
    deleting.textContent = 'Delete in progress';
    formContainer.insertBefore(loading,form);
    formContainer.classList.toggle('temporaryModal',true);    
    loading.appendChild(deleting); 
};

const implementOverlay = function(){
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);
}

const undoDelete = function(undoContainer){
    if(undoContainer.undo){
        return
    }
    else{
        undoContainer.undo = true;
        return
    }

};

attachSubmitHandler();