const GameShell = {
    unityInstance: null,
    toggle: (t) => {
        const parent = t.parentNode;
        const callback_name = parent.dataset.callback;

        if (callback_name && typeof GameShell[callback_name] === 'function') {
            GameShell[callback_name]();
        }
    },
    do_action: (action_name) => {
        if (GameShell[action_name] === undefined) {
            console.log('cannot find action', action_name)
            return;
        }
        GameShell[action_name]();
    },

    toggle_sounds: () => {
        if (!GameShell.unityInstance) {
            return;
        }

        const sound_on = event?.target?.checked ?? false;
        GameShell.unityInstance.SendMessage('SoundManager', 'ToggleMute', `${sound_on}`);
    },

    collapse_quick_actions: () => {
        document.querySelector('#toggle_menu input[type=checkbox]').checked = false;
    },

    // region game rules
    /**
     * @returns {HTMLDialogElement}
     */
    get_game_rules_modal: () => {
        return document.querySelector('dialog#game_rules.fugaso');
    },
    show_game_rules: () => {
        GameShell.get_game_rules_modal().showModal();
        GameShell.collapse_quick_actions();
    },
    close_game_rules: () => {
        GameShell.get_game_rules_modal().close();
    },
    // endregion

    /**
     * @returns {HTMLCanvasElement}
     */
    get_unity_canvas: () => {
        return document.getElementById('unity-canvas');
    },

    handle_resize: () => {
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
    toggle_fullscreen: () => {
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
    /**
     * @returns {HTMLDialogElement}
     */
    get_quit_modal: () => document.querySelector('dialog#quit_modal'),
    show_quit_dialog: () => {
        GameShell.get_quit_modal().showModal();
        GameShell.collapse_quick_actions();
    },
    hide_quit_dialog: () => {
        GameShell.get_quit_modal().close();
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

    // region language selector
    /**
     *
     * @returns {HTMLDialogElement}
     */
    current_language: 'en',
    /**
     * @see https://flagicons.lipis.dev/
     */
    available_languages: [
        {
            'code': 'en',
            'label': 'ENGLISH'
        },
        {
            'code': 'es',
            'label': 'ESPAÑOL'
        },
        {
            'code': 'fe',
            'label': 'FRANÇAIS'
        },
        {
            'code': 'pt',
            'label': 'PORTUGUÊS'
        },
        {
            'code': 'cn',
            'label': '中国人'
        }
    ],
    get_language_modal: () => {
        return document.querySelector('dialog#language_modal')
    },
    /**
     * @returns {HTMLImageElement}
     */
    get_language_modal_flag: () => {
        return GameShell.get_language_modal().querySelector('img.flag');
    },
    /**
     * @returns {HTMLImageElement}
     */
    get_language_modal_label: () => {
        return GameShell.get_language_modal().querySelector('label');
    },
    /**
     * @returns {string}
     */
    get_requested_language: () => {
        return GameShell.get_language_modal_flag().getAttribute('src').split('/').pop().split('.').shift();
    },
    previous_language: () => {
        const current_index = GameShell.available_languages.findIndex(i => i.code === GameShell.get_requested_language())
        const index_to_use = (current_index -1 + GameShell.available_languages.length) % GameShell.available_languages.length;
        const language_to_use = GameShell.available_languages[index_to_use].code;
        GameShell.get_language_modal_label().innerText = GameShell.available_languages[index_to_use].label;
        GameShell.update_flag_image_elements(language_to_use);
    },
    next_language: () => {
        const current_index = GameShell.available_languages.findIndex(i => i.code === GameShell.get_requested_language())
        const index_to_use = (current_index +1) % GameShell.available_languages.length;
        const language_to_use = GameShell.available_languages[index_to_use].code;
        GameShell.get_language_modal_label().innerText = GameShell.available_languages[index_to_use].label;
        GameShell.update_flag_image_elements(language_to_use);
    },
    update_flag_image_elements: (language_code) => {
        document.querySelectorAll('img.flag').forEach(i => {
            i.src = `https://ik.imagekit.io/bmp6bnlpn/flags/${language_code}.svg?updatedAt=1750776194371`;
        })
    },
    // show language selector modal
    show_language_modal: () => {
        GameShell.get_language_modal().showModal();
        GameShell.collapse_quick_actions();
    },
    update_language: () => {
        const requested_language = GameShell.get_requested_language();
        if(requested_language === GameShell.current_language){
            GameShell.close_language_modal(true);
            return;
        }
        GameShell.current_language = requested_language;
        GameShell.close_language_modal();
        GameShell.unityInstance.SendMessage('LanguageManager', 'Update', requested_language)
    },
    close_language_modal: (force = false) => {
        if(force){
            const index_to_use = GameShell.available_languages.findIndex(i => i.code === GameShell.current_language)
            const language_to_use = GameShell.available_languages[index_to_use].code;
            GameShell.get_language_modal_label().innerText = GameShell.available_languages[index_to_use].label;
            GameShell.update_flag_image_elements(language_to_use);
        }
        GameShell.get_language_modal().close();
    },
    // endregion

    // region error popup
    show_error_popup: (error_text = '') => {
        const error_modal = document.querySelector('dialog#error_modal');
        error_modal.addEventListener('cancel', event => {
            event.preventDefault();
            event.stopPropagation();
            GameShell.reload();
        });
        error_modal.showModal();
        GameShell.collapse_quick_actions();
    },
    reload: () => {
        document.location.reload();
    },
    // endregion

    // region bet amounts
    /**
     * @returns {HTMLDialogElement}
     */
    get_bet_amounts_modal:() => {
        return document.querySelector('dialog#bet_amounts_modal');
    },
    show_bet_amounts:() => {
        GameShell.get_bet_amounts_modal().showModal();
        GameShell.collapse_quick_actions();
    },
    /**
     *
     * @param input_radio {HTMLInputElement}
     */
    set_bet: (input_radio) => {
        GameShell.unityInstance.SendMessage('WagerManager', 'SetBet', `${input_radio.value}`);

    },
    close_bet_amounts:() => {
        GameShell.get_bet_amounts_modal().close();
    },
    // endregion
    init: (unityInstance = null) => {
        this.unityInstance = unityInstance;
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
        window.addEventListener('resize', GameShell.handle_resize);
    }
}
document.addEventListener('DOMContentLoaded', GameShell.init)