const GameShell = {
    unityInstance: null,
    toggle: (t) => {
        const parent = t.parentNode;
        const callback_name = parent.dataset.callback;

        if (callback_name && typeof GameShell[callback_name] === 'function') {
            console.log('toggle', callback_name)
            GameShell[callback_name]();
        } else {
            console.log('callback cant be called', callback_name);
        }
    },
    do_action: (action_name) => {
        if (GameShell[action_name] === undefined) {
            console.log('cannot find action', action_name)
            return;
        }
        console.log('doing action', action_name)
        GameShell[action_name]();
    },

    toggle_sounds: () => {
        if (!GameShell.unityInstance) {
            return;
        }

        const sound_on = event?.target?.checked ?? false;
        GameShell.unityInstance.SendMessage('SoundManager', 'ToggleMute', `${sound_on}`);
    },

    /**
     * @returns {HTMLCanvasElement}
     */
    get_unity_canvas: () => {
        return document.getElementById('unity-canvas');
    },

    handle_resize: () => {
        // GameShell.get_unity_canvas().width = window.innerWidth;
        // GameShell.get_unity_canvas().height = window.innerHeight;
        // GameShell.get_unity_canvas().style.width = window.innerWidth + 'px';
        // GameShell.get_unity_canvas().style.height = window.innerHeight + 'px';

        GameShell.get_unity_canvas().style.width = (window.innerWidth / 100.0 * 90.0) + "px";
        GameShell.get_unity_canvas().style.height = (window.innerHeight / 100.0 * 90.0) + "px";

    },

    // region fullscreen functionality
    is_fullscreen: false,
    fullscreen_with_shell: () => {
        if (document.fullscreenElement === null) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
                GameShell.is_fullscreen = true;
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                GameShell.is_fullscreen = false;
            }
        }
    },
    fullscreen: () => {
        if (!GameShell.unityInstance) {
            return;
        }
        if (!GameShell.is_fullscreen) {
            GameShell.unityInstance.SetFullscreen(1);
        } else {
            GameShell.unityInstance.SetFullscreen(0);
        }
        GameShell.is_fullscreen = !GameShell.is_fullscreen;
    },
    // endregion

    // region quit game functionality
    request_quit: () => {
        if (!GameShell.unityInstance) {
            console.log('cannot quit');
        }
        GameShell.show_quit_confirm_dialog();
    },
    create_quit_confirm_dialog: () => {
        const dialog = document.createElement('dialog');
        dialog.id = 'dialog-quit-confirm';
        dialog.addEventListener('click', GameShell.hide_quit_confirm_dialog);
        dialog.innerHTML = `
            <div>Do you really want to exit this game?</div>
            <div>Clock OK to exit or CANCEL to stay in this game.</div>
            <footer>
                <button tabindex="-1" onclick="GameShell.quit_confirm()">OK</button>
                <button tabindex="1" class="success" onclick="GameShell.hide_quit_confirm_dialog()">CANCEL</button>
            </footer>
        `;
        document.body.appendChild(dialog);
    },
    /**
     * @returns {HTMLDialogElement}
     */
    quit_confirm_dialog: () => document.getElementById('dialog-quit-confirm'),
    show_quit_confirm_dialog: () => {
        GameShell.quit_confirm_dialog().showModal();
    },
    hide_quit_confirm_dialog: () => {
        GameShell.quit_confirm_dialog().close();
    },
    quit_confirm: () => {
        GameShell.unityInstance.Quit()
            .then(() => {
                // Remove DOM elements from the page so GC can run
                document.querySelector("#unity-container").remove();
                canvas = null;
                // Remover script elements from the page so GC can run
                script.remove();
                script = null;
                document.location.href = 'https://www.uroc.com'
            });
    },
    // endregion

    collapse_quick_actions: () => {
        document.querySelector('[data-callback="expand_menu"] input[type=checkbox]').checked = false;
    },

    // region slide out panel
    get_slide_out_panel: () => {
        return document.querySelector('#slide-out-panel')
    },

    show_slide_out_panel: () => {
        GameShell.collapse_quick_actions();
        GameShell.get_slide_out_panel().showModal()
    },

    hide_slide_out_panel: (force = false) => {
        if(event.target.id !== 'slide-out-panel' && force === false){
            return;
        }

        GameShell.get_slide_out_panel().close();
    },
    // endregion

    init: () => {
        document
            .querySelectorAll('label.toggle input[type=checkbox]')
            .forEach(i => {
                i.addEventListener('change', (event) => GameShell.toggle(i));
            })
        document
            .querySelectorAll('.action[data-action]')
            .forEach(i => {
                i.addEventListener('click', (event) => GameShell.do_action(i.dataset.action));
            })

        if (window['canvas']) {
            canvas.addEventListener('fullscreenchange', (event) => {
                GameShell.is_fullscreen = document.fullscreenElement;
            })
        }
        GameShell.create_quit_confirm_dialog();
        window.addEventListener('resize', GameShell.handle_resize);
    }
}
document.addEventListener('DOMContentLoaded', GameShell.init)