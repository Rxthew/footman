const toggleAddLinks = function () {
  const reveal = document.querySelector(".revealAddLinks");
  if (reveal) {
    reveal.classList.toggle("hideAddLinks", true);
    reveal.classList.toggle("revealAddLinks", false);
  } else {
    const hide = document.querySelector(".hideAddLinks");
    hide.classList.toggle("revealAddLinks", true);
    hide.classList.toggle("hideAddLinks", false);
  }
  toggleGold();
  toggleRotate();
};

const toggleGold = function () {
  const path = document.querySelector(".add");
  if (document.querySelector(".revealAddLinks")) {
    path.classList.toggle("gold", true);
  } else {
    path.classList.toggle("gold", false);
  }
};

const toggleRotate = function () {
  const path = document.querySelector(".add");
  const svg = path.parentElement;
  if (svg.classList.contains("fwdrotate")) {
    svg.classList.toggle("fwdrotate", false);
    svg.classList.toggle("bckwdrotate", true);
  } else {
    svg.classList.toggle("bckwdrotate", false);
    svg.classList.toggle("fwdrotate", true);
  }
};

const addLinks = document.querySelector(".addLinks");
addLinks.addEventListener("click", toggleAddLinks);

const attachModalListeners = function () {
  const hidden = document.querySelector(".hidden");
  const choose = document.querySelector(".choose");
  if (!hidden || !choose) {
    return;
  }
  choose.addEventListener("click", () => effectModal(hidden));
  const exit = document.querySelector(".closeChoose").firstElementChild;
  exit.addEventListener("click", minimiseModal);
};

const effectModal = function (hidden) {
  const implementOverlay = function () {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.setAttribute("aria-label", "overlay");
    overlay.setAttribute("role", "button");
    overlay.setAttribute("tabindex", "0");
    overlay.addEventListener("click", minimiseModal);
    document.body.appendChild(overlay);
  };

  const toggleReveal = function () {
    hidden.classList.toggle("hidden", false);
    hidden.setAttribute("aria-model", "true");
    hidden.setAttribute("tabindex", 0);
    hidden.addEventListener("focusout", defaultModalTabTrap);
  };

  toggleReveal();
  implementOverlay();
};

const minimiseModal = function () {
  const modal = document.querySelector("dialog");
  const overlay = document.querySelector(".overlay");

  const toggleHide = function () {
    modal.classList.toggle("hidden", true);
    modal.setAttribute("aria-model", "false");
    modal.removeEventListener("focusout", defaultModalTabTrap);
  };

  const removeOverlay = function () {
    overlay.remove();
  };

  if (modal && overlay) {
    toggleHide();
    removeOverlay();
  }
};

const defaultModalTabTrap = function (event) {
  const parent = event.currentTarget;
  const focusableChildren = parent.querySelectorAll(
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
  );
  const children = Array.from(focusableChildren);
  if (children.includes(event.relatedTarget)) {
    return;
  }
  setTimeout(() => parent.focus(), 0);
};

attachModalListeners();

const highlightHomepageMarker = function () {
  if (window.location.pathname === "/") {
    const anchor = document.querySelector('a[href="/"]');
    const path = document.querySelector(".home");
    path.classList.add("gold");
    anchor.classList.add("goldBorder");
  }
};

highlightHomepageMarker();
