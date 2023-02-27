const toggleGold = function(){
    const path = document.querySelector('.add');
    if(document.querySelector('.revealAddLinks')){
        path.classList.toggle('gold',true);
    }
    else{
        path.classList.toggle('gold',false);
    }
};

const toggleRotate = function(){
    const path = document.querySelector('.add');
    const svg = path.parentElement;
    if(svg.classList.contains('fwdrotate')){
        svg.classList.toggle('fwdrotate',false)
        svg.classList.toggle('bckwdrotate',true)
    }
    else{
        svg.classList.toggle('bckwdrotate',false)
        svg.classList.toggle('fwdrotate',true)

    }  

};

const addLinks = document.querySelector('.addLinks');
addLinks.addEventListener('click', function(){
    const reveal = document.querySelector('.revealAddLinks');
    if(reveal){
        reveal.classList.toggle('hideAddLinks',true);
        reveal.classList.toggle('revealAddLinks',false);
    }
    else{
        const hide = document.querySelector('.hideAddLinks');
        hide.classList.toggle('revealAddLinks',true);
        hide.classList.toggle('hideAddLinks',false);
    }
    toggleGold()
    toggleRotate()
});

const attachModalListeners = function(){
    const hidden = document.querySelector('.hidden');
    const choose = document.querySelector('.choose');
    if(!hidden || !choose){
        return
    }
    choose.addEventListener('click', () => effectModal(hidden))
    const exit = document.querySelector('.closeChoose');
    exit.addEventListener('click', minimiseModal);

};

const effectModal = function(hidden){
    const toggleReveal = function(){
        hidden.classList.toggle('hidden',false);
        hidden.classList.toggle('choices',true);
    }
    const implementOverlay = function(){
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        overlay.addEventListener('click', minimiseModal);
        document.body.appendChild(overlay);
    }

    toggleReveal();
    implementOverlay();
    
};

const minimiseModal = function(){
    const choose = document.querySelector('.choose');
    const modal = document.querySelector('.choices');
    const overlay = document.querySelector('.overlay');
    
    const toggleHide = function(){
        modal.classList.toggle('hidden',true);
        modal.classList.toggle('choices',false);
    };

    const removeOverlay = function(){
        overlay.remove();
    };

    if(modal && overlay){
        toggleHide();
        removeOverlay();

    }
};

attachModalListeners();