const isChrome = navigator.userAgent.indexOf('Chrome') != -1;
function VALVE(pipe = () => {}, interval) {
  let executed = false;

  return (args = pipe.arguments) => {
    if (executed) return;

    pipe.apply(this, args);
    executed = true;

    setTimeout(() => {
      executed = false;
      pipe.apply(this, args);
    }, interval);
  };
}

function DEBOUNCE(func = () => {}, wait) {
  let timer = null;

  return (args = func.arguments) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

const TAB_FOCUS_KEY_DOWN = (() => {

  function _GET_ELEMENTS(rootEl) {
    let nd = ":not([disabled])";
    return rootEl.querySelectorAll(
      `a${nd},button${nd},textarea${nd},input[type="text"]${nd},input[type="radio"]${nd},input[type="checkbox"]${nd},select${nd}`
    );
  }

  function _CHANGE_ELEMENT(ev, elements, traped) {
    let elActive = [...elements].find((el) => document.activeElement === el);

    let firstEl = elements[0];
    let lastEl = elements[elements.length - 1];

    if (ev.shiftKey) {
      if (document.activeElement === firstEl && traped) {
        ev.preventDefault();
        return [lastEl, true]; //[,focus]
      } else {
        elActive = elements[[...elements].indexOf(elActive) - 1];
        return [elActive, false];
      }
    } else {
      if (document.activeElement === lastEl && traped) {
        ev.preventDefault();
        return [firstEl, true];
      } else {
        elActive = elements[[...elements].indexOf(elActive) + 1];
        return [elActive, false];
      }
    }
  }

  function _AUTO_SCROLL([elActive, focus], handleScroll) {
    if (!handleScroll) return;
    if (!elActive) return;
    //elActive.style.backgroundColor = "red";
    
    elActive.addEventListener("focus", autoScroll, { once: true });
    if (focus) elActive.focus();

    function autoScroll() {
      if(isChrome)return;
      let height = window.innerHeight;
      let dist = elActive.getBoundingClientRect();
      let newDist;
      let y = scrollY;

      if (dist.top < height / 3) {
        newDist = y - height / 3;
        newDist -= elActive.classList.contains("firstTab") ? height : 0;
        scrollTo({ top: newDist, behavior: "smooth" });
      } else if (height - dist.bottom < height / 3) {
        newDist = y + height / 3;
        scrollTo({ top: newDist, behavior: "smooth" });

      }
    }
  }
  function _REMOVE_EVENT_LISTENER(refFunc, element){
    element.removeEventListener("keydown", refFunc);
  }
  return (ROOTELEMENT, TRAPED = false, HANDLESCROLL = true) => {
    let _elements = _GET_ELEMENTS(ROOTELEMENT);
    let _rootElement = ROOTELEMENT;
    let _traped = TRAPED;
    let _handleScroll = HANDLESCROLL;
    let _log = true;
    let _active = false;

    return () => {
      const _updateElements = () => {
        _elements = _GET_ELEMENTS(_rootElement);
      };

      function _onTabFocusKeydown(event) {
        console.clear();
        if (!_active) {
           _REMOVE_EVENT_LISTENER(_onTabFocusKeydown,_rootElement);
          return;
        }

        if (event.key == "Tab") {
          _updateElements();
          _AUTO_SCROLL(
            _CHANGE_ELEMENT(event, _elements, _traped),
            _handleScroll
          );
        }
      }
      return {
        updateElements: () => _updateElements(),
        on: () => {
          if(!_active) _rootElement.addEventListener("keydown", _onTabFocusKeydown);
          _active = true;
        },
        off: () => {
          _active = false;
        },
        getState: {
          active: _active,
          traped: _traped,
          handleScroll: _handleScroll,
        },
        setTraped: (traped)=> _traped=traped,
        setHandleScroll: (handleScroll)=> _handleScroll=handleScroll
      };
    };
  };
})();

const bodyTabFocus = TAB_FOCUS_KEY_DOWN(document.body, false, true);
bodyTabFocus().on();

const menu = (() => {
  const _menuTabFocus = TAB_FOCUS_KEY_DOWN(navigation, true, true);
  let _opened = false;
  return () => {

    return {
      isOpened: () => _opened,
      open() {
        _opened = true;
        _menuTabFocus().on();

        document.body.classList.add("menu-expanded");
        this.showNavSticky();
      },
      close() {
        _opened = false;
        _menuTabFocus().off();

        document.body.classList.remove("menu-expanded");
        this.showNavSticky();
      },
      showNavSticky() {
        if (scrollY > 0 || _opened) {
          navigation.classList.add("sticky");
        } else {
          navigation.classList.remove("sticky");
        }
      },
    };
  };
})();

const onScroll = (() => {
  function scrollReveal(elements) {
    for (var i = 0; i < elements.length; i++) {
      let heightWin = window.innerHeight;
      let distanceTop = elements[i].getBoundingClientRect().top;

      if (distanceTop <= heightWin * 0.7)
        elements[i].classList.add("scrollReveal");
    }
  }
  function showBackToTopButton() {
    if (scrollY > 600) {
      backToTopButton.classList.add("show");
    } else {
      backToTopButton.classList.remove("show");
    }
  }
  return () => {
    menu().showNavSticky();
    showBackToTopButton();
    scrollReveal([document.body, navigation, home, services, about, contact]);
    activeMenuAtCurrentSection([home, services, about, contact]);
  };
})();
onScroll();
window.addEventListener("scroll", VALVE(onScroll, 400));

function activeMenuAtCurrentSection(sections = []) {
  function _getMenuElement(section) {
    const me = document.querySelector(
      `.menu a[href*=${section.getAttribute("id")}]`
    );
    return {
      active: (active) => {
        if (active) {
          me.classList.add("active");
        } else {
          me.classList.remove("active");
        }
      },
    };
  }
  function clearMenu() {
    sections.forEach((sc) => {
      _getMenuElement(sc).active(false);
    });
  }
  function onMiddleElement(offset=0) {
    const lineChecker = scrollY +(innerHeight / 2) -offset;

    sections.forEach((sc) => {
      const scTop = sc.offsetTop;
      const scHeight = sc.offsetHeight;
      const scBottom = scTop + scHeight;

      const scTopPassed = lineChecker >= scTop;
      const scBottomPassed = lineChecker >= scBottom;

      if (scTopPassed && !scBottomPassed) {
        _getMenuElement(sc).active(true);
        return true;
      }
    });
    return false;
  }
  function onBottomSetActive(offset=0) {
    const screenLineBottom = innerHeight + scrollY;
    const documenBottom = document.body.scrollHeight ;

    if (screenLineBottom >= documenBottom-offset ) {
      _getMenuElement(sections[sections.length - 1]).active(true);
      return true;
    }
    return false;
  }
  function onTopSetActive(offset=0) {
    const screenLineTop = scrollY;
    const documenTop = 0;

    if (screenLineTop <= documenTop+offset) {
      _getMenuElement(sections[0]).active(true);
      return true;
    }
    return false;
  }

  clearMenu();
  if (onTopSetActive(10)) return;
  if (onBottomSetActive(10)) return;
  if (onMiddleElement(innerHeight/10)) return;
}

function changeColorPage(){
  document.querySelector(':root').style.setProperty('--hue', Math.random()*360);
  
}
