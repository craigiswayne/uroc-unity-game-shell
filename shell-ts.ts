import GUI from 'lil-gui';

window.addEventListener('bet_changed', (bet_changed_event: CustomEvent) => {
    GameShell.set_bet(bet_changed_event.detail.amount);
})

window.addEventListener('time_out', () => {
    GameShell.show_error_popup('Your session has timed out')
})

window.addEventListener('pay_tables_changed', (pay_tables_changed) => {
    GameShell.format_pay_tables(pay_tables_changed.detail.pay_tables)
    GameShell.populate_pay_tables();
})

window.alert = (message) => {
    console.log('Alert Swallowed:', message);
}

interface UnityInstance {
    SendMessage(gameObjectName: string, methodName: string, message: string): void;
    SetFullscreen(state: number): void;
    Quit(): Promise<void>;
}

interface FormattedPayTables {
    symbol_number: number,
    symbol_code: string,
    multipliers: { count: number, payout: number }[]
}

interface RawPayTables {
    symbol: number,
    count: number,
    payout: number
}

class GameShell {
    public static lil_gui?: GUI;
    public static unityInstance?: UnityInstance;

    public static toggle(t: HTMLInputElement) {
        const parent = t.parentNode! as HTMLElement;
        const callback_name = parent.dataset.callback;

        // @ts-ignore
        if (callback_name && typeof GameShell[callback_name] === 'function') {
            // @ts-ignore
            GameShell[callback_name]();
        }
    }

    public static toggle_sounds(input_element: HTMLInputElement) {
        const sound_on = input_element.checked ?? false;
        GameShell.send_message_to_unity('mute', { state: sound_on});
    }

    public static collapse_quick_actions() {
        document.querySelector<HTMLInputElement>('#toggle_menu input[type=checkbox]')!.checked = false;
    }

    // TODO: use this
    public static get_dialog_by_id(id_selector: string): HTMLDialogElement {
        return document.querySelector<HTMLDialogElement>(id_selector)!;
    }
    public static get_game_rules_modal(): HTMLDialogElement {
        return document.querySelector<HTMLDialogElement>('dialog#game_rules.fugaso')!;
    }
    public static show_game_rules() {
        GameShell.get_game_rules_modal().showModal();
        GameShell.collapse_quick_actions();
    }
    public static close_game_rules() {
        GameShell.get_game_rules_modal().close();
    }
    public static get_unity_canvas() {
        return document.getElementById('unity-canvas');
    }

    public static is_fullscreen = false;
    // fullscreen_with_shell: () => {
    //     if (document.fullscreenElement === null) {
    //         const element = document.documentElement;
    //         if (element.requestFullscreen) {
    //             element.requestFullscreen();
    //             GameShell.is_fullscreen = true;
    //         }
    //     } else {
    //         if (document.exitFullscreen) {
    //             document.exitFullscreen();
    //             GameShell.is_fullscreen = false;
    //         }
    //     }
    // },
    // toggle_fullscreen: () => {
    //     if (!GameShell.unityInstance) {
    //         return;
    //     }
    //     if (!GameShell.is_fullscreen) {
    //         GameShell.unityInstance.SetFullscreen(1);
    //     } else {
    //         GameShell.unityInstance.SetFullscreen(0);
    //     }
    //     GameShell.is_fullscreen = !GameShell.is_fullscreen;
    // },

    public static get_quit_modal() {
        return document.querySelector<HTMLDialogElement>('dialog#quit_modal')!;
    }
    public static show_quit_dialog() {
        GameShell.get_quit_modal().showModal();
        GameShell.collapse_quick_actions();
    }

    public hide_quit_dialog() {
        GameShell.get_quit_modal().close();
    }
    public static quit_confirm() {
        try {
            // @ts-ignore
            GameShell.unityInstance.Quit()
                .then(() => {
                    // Remove DOM elements from the page so GC can run
                    document.querySelector<HTMLDivElement>("#unity-container")!.remove();
                    // @ts-ignore
                    canvas = null;
                    // Remover script elements from the page so GC can run
                    // @ts-ignore
                    script.remove();
                    // @ts-ignore
                    script = null;
                    document.location.href = 'https://www.uroc.com'
                });
        } catch (ex){
            console.log(ex);
        }

    }
    public static current_language = 'en';
    /**
     * @see https://flagicons.lipis.dev/
     */
    public static available_languages = [
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
    ];
    public static get_language_modal(): HTMLDialogElement {
        return document.querySelector<HTMLDialogElement>('dialog#language_modal')!;
    }
    public static get_language_modal_flag(): HTMLImageElement {
        return GameShell.get_language_modal().querySelector<HTMLImageElement>('img.flag')!;
    }

    public static get_language_modal_label(): HTMLLabelElement {
        return GameShell.get_language_modal().querySelector<HTMLLabelElement>('label')!;
    }

    public static get_requested_language(): string {
        // @ts-ignore
        return GameShell.get_language_modal_flag()
            .getAttribute('src')
            .split('/')
            .pop()
            .split('.')
            .shift();
    }
    public static previous_language(): void {
        const current_index = GameShell.available_languages.findIndex(i => i.code === GameShell.get_requested_language())
        const index_to_use = (current_index -1 + GameShell.available_languages.length) % GameShell.available_languages.length;
        const language_to_use = GameShell.available_languages[index_to_use].code;
        GameShell.get_language_modal_label().innerText = GameShell.available_languages[index_to_use].label;
        GameShell.update_flag_image_elements(language_to_use);
    }
    public static next_language(): void {
        const current_index = GameShell.available_languages.findIndex(i => i.code === GameShell.get_requested_language())
        const index_to_use = (current_index +1) % GameShell.available_languages.length;
        const language_to_use = GameShell.available_languages[index_to_use].code;
        GameShell.get_language_modal_label().innerText = GameShell.available_languages[index_to_use].label;
        GameShell.update_flag_image_elements(language_to_use);
    }

    public static update_flag_image_elements(language_code: string): void {
        document.querySelectorAll<HTMLImageElement>('img.flag').forEach(i => {
            i.src = `https://ik.imagekit.io/bmp6bnlpn/flags/${language_code}.svg?updatedAt=1750776194371`;
        })
    }
    public static show_language_modal(): void {
        GameShell.get_language_modal().showModal();
        GameShell.collapse_quick_actions();
    }
    public static update_language(): void {
        const requested_language = GameShell.get_requested_language();
        if(requested_language === GameShell.current_language){
            GameShell.close_language_modal(true);
            return;
        }
        GameShell.current_language = requested_language;
        GameShell.close_language_modal();
        GameShell.send_message_to_unity('setLanguage', { language: requested_language, isSocial: false });
    }

    public static close_language_modal(force = false): void {
        if(force){
            const index_to_use = GameShell.available_languages.findIndex(i => i.code === GameShell.current_language)
            const language_to_use = GameShell.available_languages[index_to_use].code;
            GameShell.get_language_modal_label().innerText = GameShell.available_languages[index_to_use].label;
            GameShell.update_flag_image_elements(language_to_use);
        }
        GameShell.get_language_modal().close();
    }

    public static show_error_popup(error_text = ''): void {
        const error_modal = document.querySelector<HTMLDialogElement>('dialog#error_modal')!;
        error_modal.addEventListener('cancel', event => {
            event.preventDefault();
            event.stopPropagation();
            GameShell.reload();
        });
        if(error_text){
            error_modal.querySelector('p')!.innerText = error_text;
        }
        error_modal.showModal();
        GameShell.collapse_quick_actions();
    }
    public static reload(): void {
        document.location.reload();
    }

    public static current_bet = 0;
    // TODO remove this
    public static bet_levels: {label: string, active?: boolean}[] = [
        {
            label: '$ 20.00'
        },
        {
            label: '$ 30.00'
        },
        {
            label: '$ 40.00'
        },
        {
            label: '$ 50.00'
        },
        {
            label: '$ 60.00'
        },
        {
            label: '$ 80.00'
        },
        {
            label: '$ 100.00'
        },
        {
            label: '$ 160.00'
        },
        {
            label: '$ 200.00',
            active: true
        },
        {
            label: '$ 240.00'
        },
        {
            label: '$ 300.00'
        },
        {
            label: '$ 400.00'
        },
        {
            label: '$ 500.00'
        }
    ];
    public static populate_bet_levels(): void {
        const container = GameShell.get_bet_levels_modal().querySelector('.grid')!;
        container.innerHTML = '';
        GameShell.bet_levels
            // .filter( i => i.enabled === undefined || i.enabled === true)
            .forEach(i => {
                const clickable: HTMLLabelElement = document.createElement('label');
                clickable.innerText = i.label;

                const input: HTMLInputElement = document.createElement('input');
                const value = parseInt(i.label.replace(/[^0-9.]/g, ''))
                input.type = 'radio';
                input.name = 'amounts';
                input.value = value.toString();
                input.checked = i.active !== undefined && i.active;
                if(input.checked){
                    GameShell.current_bet = value;
                }
                input.addEventListener('change', () => {
                    GameShell.set_bet(value);
                })
                clickable.appendChild(input);
                container.appendChild(clickable);
            })
    }
    public static get_bet_levels_modal(): HTMLDialogElement {
        return document.querySelector('dialog#bet_levels_modal')!;
    }
    public static show_bet_levels(): void {
        GameShell.get_bet_levels_modal().showModal();
        GameShell.collapse_quick_actions();
    }

    public static set_bet(value: number): void {
        if(value.toString() === GameShell.current_bet.toString()){
            return;
        }
        GameShell.current_bet = value;
        GameShell.send_message_to_unity('setBet', {value});
        const existing_bet_level_radio = GameShell.get_bet_levels_modal().querySelector<HTMLInputElement>(`input[type=radio][value="${value}"]`);
        if(!existing_bet_level_radio){
            return;
        }
        existing_bet_level_radio.checked = true;

    };
    public static close_bet_levels(): void {
        GameShell.get_bet_levels_modal().close();
    }

    public static pay_tables: FormattedPayTables[] = [];
    public static get_pay_tables_grid(): HTMLDialogElement {
        return document.querySelector<HTMLDialogElement>('.grid.paytable')!;
    }

    public static format_pay_tables(pay_tables_received_in_event: RawPayTables[]): FormattedPayTables[] {
        if(pay_tables_received_in_event === undefined){
            return GameShell.pay_tables = [];
        }

        const symbol_map = [
            'WC',
            'AA',
            'BB',
            'CC',
            'DD',
            'EE',
            'FF',
            'GG',
            'HH',
            'JJ',
            'C01',
            'C02',
            'C03',
            'C04',
            'C05',
            'C30'
        ]

        const result: FormattedPayTables[] = [];

        pay_tables_received_in_event.forEach(item => {
            // don't care about 0 payouts
            if(item.payout === 0){
                return
            }
            const existing_group_index = result.findIndex( i => i.symbol_number === item.symbol);
            if(existing_group_index !== -1){
                result[existing_group_index].multipliers.push({
                    count: item.count,
                    payout: item.payout
                })
            } else {
                const new_group = {
                    symbol_number: item.symbol,
                    symbol_code: symbol_map[item.symbol] ?? 'unknown',
                    multipliers: [{
                        count: item.count,
                        payout: item.payout
                    }]
                };
                result.push(new_group);
            }
        })
        // Reverse the multiplier data so that it goes x5 ... x1
        result.map(i => { i.multipliers = i.multipliers.reverse(); return i});
        GameShell.pay_tables = result;
        return result;
    }

    public static populate_pay_tables(): void {
        const grid = GameShell.get_pay_tables_grid();
        grid.innerHTML = '';
        GameShell.pay_tables.forEach(pay_table => {
            const item = document.createElement('div');
            item.className = 'item';

            const symbol_container = document.createElement('div');
            symbol_container.className = 'symbol_container';
            symbol_container.innerHTML = `<img class="symbol" src="https://ik.imagekit.io/bmp6bnlpn/games/miami_blaze/symbols/symbol-${pay_table.symbol_code}.png?updatedAt=1752246761900" alt="pay table symbol-${pay_table.symbol_number}" />`;

            const data_container = document.createElement('div');
            data_container.className = 'data';
            pay_table.multipliers.forEach(row => {
                data_container.innerHTML += `
                     <div class="row">
                         <div class="count">x${row.count}</div>
                         <div class="multiplier">${row.payout}</div>
                     </div>
                 `;

            });
            item.appendChild(symbol_container);
            item.appendChild(data_container);
            grid.appendChild(item);
        })

    }

    public static send_message_to_unity(command: string, payload = {}): void {
        if(!GameShell.unityInstance){
            return;
        }
        const message = JSON.stringify({ command, payload });
        try{
            GameShell.unityInstance.SendMessage('GameBridge', 'Pass', message);
        } catch (ex) {
            console.warn(ex);
        }
    }


    public static init(unityInstance: UnityInstance): void {
        GameShell.unityInstance = unityInstance;
        document.querySelector<HTMLDivElement>('#unity-loading-bar')!.style.display = 'none';
        if(GameShell.lil_gui){
            GameShell.lil_gui.show();
        }
        document.querySelector('#quick-actions')!.classList.add('active');
        document
            .querySelectorAll<HTMLInputElement>('label.toggle input[type=checkbox]')
            .forEach(i => {
                i.addEventListener('change', () => GameShell.toggle(i));
            })

        // @ts-ignore
        if(window['canvas'] as HTMLCanvasElement !== undefined){
            // @ts-ignore
            window['canvas'].addEventListener('fullscreenchange', () => {
                GameShell.is_fullscreen = document.fullscreenElement !== null;
            })
        }

    }
}
