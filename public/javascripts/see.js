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
        const loadingIndicator = document.querySelector('#loading');
        const undoButton = document.querySelector('#undo');
        clearInterval(intervalId);
        clearTimeout(timeoutId);
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
        setUpUndoInterface();
        setUpLoadingInterface();
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
    undoButton.textContent = 'UNDO DELETE';
    formContainer.appendChild(undoButton);
};

const setUpLoadingInterface = function(){
    const formContainer = document.querySelector('#formContainer');
    const loading = document.createElement('div');
    const deleting = document.createElement('span');
    loading.id = 'loading';
    deleting.id = 'deleting';
    deleting.textContent = 'Delete in progress';
    formContainer.appendChild(loading);
    loading.appendChild(deleting);     
};


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