const GameShell = {
    toggle: (t) => {
        const parent = t.parentNode;
        const callback_name = parent.dataset.callback;

        if (callback_name && typeof GameShell[callback_name] === 'function') {
            GameShell[callback_name]();
        } else {
            console.log('callback cant be called');
        }
    },
    do_action: (action_name) => {
        console.log('doing action', action_name)
    },
    toggle_menu: () => {
        document.querySelector('.sub-menu').classList.toggle('open')
    },
    toggle_fullscreen: () => {
        if (document.fullscreenElement === null) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },
    init: () => {
        document
            .querySelectorAll('label.toggle input[type=checkbox]')
            .forEach(i => {
                i.addEventListener('change', (event) =>  GameShell.toggle(i));
            })
        document
            .querySelectorAll('button.action')
            .forEach(i => {
                i.addEventListener('click', (event) =>  GameShell.do_action(i.dataset.action));
            })
    }
}

document.addEventListener('DOMContentLoaded', GameShell.init)