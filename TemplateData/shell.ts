interface ReelSoftCurrency {
    code: string;
    decimal: string;
    denomination: number;
    grouping: string;
    precision: number;
    prefix: string;
    suffix: string;
}

interface ReelSoftOpenGameData {
    betLevels: number[];
    currency: ReelSoftCurrency;
    defaultBet: number;
    payTable: RawPayTables[];
    rtpVersion: number;
}

interface UnityInstance {
    SendMessage(gameObjectName: string, methodName: string, message: string): void;
    SetFullscreen(state: number): void;
    Quit(): Promise<void>;
    GetMetricsInfo(): void;
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

type AvailableDialogs = 'game_rules' | 'quit_modal' | 'language_modal' | 'error_modal' | 'bet_levels_modal';

// @ts-ignore
window.addEventListener('bet_changed', (bet_changed_event: CustomEvent<{amount: number}>) => {
    GameShell.set_bet(reelsoft_number_to_normal_number(bet_changed_event.detail.amount));
})

window.addEventListener('time_out', () => {
    GameShell.show_error_popup('Your session has timed out')
})

// @ts-ignore
window.addEventListener('open_game_data', (open_game_data: CustomEvent<ReelSoftOpenGameData>) => {
    GameShell.current_bet = reelsoft_number_to_normal_number(open_game_data.detail.defaultBet);
    GameShell.bet_levels = open_game_data.detail.betLevels.map((i: number) => {
        return {
            with_decimals: reelsoft_number_to_normal_number(i),
            raw: i
        }
    });

    GameShell.set_currency_symbol(open_game_data.detail.currency)
        .then(GameShell.populate_bet_levels);
    GameShell.format_pay_tables(open_game_data.detail.payTable)
        .then(GameShell.populate_pay_tables);

    GameShell.update_rtp(open_game_data.detail.rtpVersion);
})

window.alert = (message) => {
    console.log('Alert Swallowed:', message);
}

const reelsoft_number_to_normal_number = (number: number): string => {
    return (number / 100).toFixed(2);
}

class GameShell {
    // @ts-ignore
    public static lil_gui?: GUI;
    public static unityInstance?: UnityInstance;
    public static rtp = 100;
    public static is_fullscreen = false;
    public static current_language = 'en';
    public static currency_prefix = '';
    public static current_bet = `0.00`;
    public static bet_levels: { with_decimals: string, raw: number }[] = [];
    public static pay_tables: FormattedPayTables[] = [];
    public static asset_url = '';
    public static splash_video_ended = false;

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

    public static async update_rtp(value: number): Promise<void> {
        this.rtp = value;
        document.querySelector<HTMLSpanElement>('.bind.rtp')!.innerText = `${this.rtp}%`;
    }

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
    public static get_dialog_by_id(id_selector: AvailableDialogs): HTMLDialogElement {
        return document.querySelector<HTMLDialogElement>(`dialog#${id_selector}.fugaso`)!;
    }

    public static show_dialog_by_id(id_selector: AvailableDialogs) {
        GameShell.get_dialog_by_id(id_selector).showModal();
        GameShell.collapse_quick_actions();
    }

    public static close_dialog_by_id(id_selector: AvailableDialogs) {
        GameShell.get_dialog_by_id(id_selector).close();
    }

    public static get_unity_canvas() {
        return document.getElementById('unity-canvas');
    }

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

    public static toggle_fullscreen() {
        if (!GameShell.unityInstance) {
            console.log('No unity instance to toggle fullscreen on.')
            return;
        }
        if (!GameShell.is_fullscreen) {
            GameShell.unityInstance.SetFullscreen(1);
        } else {
            GameShell.unityInstance.SetFullscreen(0);
        }
        GameShell.is_fullscreen = !GameShell.is_fullscreen;
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

    public static get_language_modal_flag(): HTMLImageElement {
        return GameShell.get_dialog_by_id('language_modal').querySelector<HTMLImageElement>('img.flag')!;
    }

    public static get_language_modal_label(): HTMLLabelElement {
        return GameShell.get_dialog_by_id('language_modal').querySelector<HTMLLabelElement>('label')!;
    }

    public static get_requested_language(): string {
        // @ts-ignore
        return GameShell.get_language_modal_flag()
            .getAttribute('src')!
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
        GameShell.get_dialog_by_id('language_modal').close();
    }

    public static async show_error_popup(error_text = ''): Promise<void> {
        const error_modal = GameShell.get_dialog_by_id('error_modal');
        error_modal.oncancel = event => {
            event.preventDefault();
            event.stopPropagation();
            GameShell.reload();
        }
        if(error_text){
            error_modal.querySelector('p')!.innerText = error_text;
        }
        error_modal.showModal();
        GameShell.collapse_quick_actions();
    }

    public static reload(): void {
        document.location.reload();
    }

    public static populate_bet_levels(): void {
        const container = GameShell.get_dialog_by_id('bet_levels_modal').querySelector('.grid')!;
        container.innerHTML = '';
        GameShell.bet_levels
            .forEach(bet_level => {
                const clickable: HTMLLabelElement = document.createElement('label');
                clickable.textContent = GameShell.currency_prefix + ` ${bet_level.with_decimals}`;

                const input: HTMLInputElement = document.createElement('input');
                input.type = 'radio';
                input.name = 'amounts';
                input.value = bet_level.with_decimals;
                input.checked = GameShell.current_bet === bet_level.with_decimals;
                input.onchange = () => {
                    GameShell.set_bet(bet_level.with_decimals);
                }
                clickable.appendChild(input);
                container.appendChild(clickable);
            })
    }

    public static async set_bet(value_with_decimals: string): Promise<void> {
        if(value_with_decimals === GameShell.current_bet){
            return;
        }
        const raw_value = GameShell.bet_levels.find(i => i.with_decimals === value_with_decimals)?.raw;
        GameShell.current_bet = value_with_decimals;
        GameShell.send_message_to_unity('setBet', {value: raw_value});
        const existing_bet_level_radio = GameShell.get_dialog_by_id('bet_levels_modal').querySelector<HTMLInputElement>(`input[type=radio][value="${value_with_decimals}"]`);
        if(!existing_bet_level_radio){
            return;
        }
        existing_bet_level_radio.checked = true;
    }

    public static get_pay_tables_grid(): HTMLDivElement {
        return document.querySelector<HTMLDivElement>('.grid.paytable')!;
    }

    public static async format_pay_tables(pay_tables_received_in_event: RawPayTables[]): Promise<FormattedPayTables[]> {
        if(pay_tables_received_in_event === undefined){
            GameShell.pay_tables = [];
            return Promise.resolve(GameShell.pay_tables);
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
                return;
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
        return Promise.resolve(GameShell.pay_tables);
    }

    public static populate_pay_tables(): void {
        const grid = GameShell.get_pay_tables_grid();
        grid.innerHTML = '';
        GameShell.pay_tables.forEach(pay_table => {
            const item = document.createElement('div');
            item.className = 'item';

            const symbol_container = document.createElement('div');
            symbol_container.className = 'symbol_container';
            symbol_container.innerHTML = `<img class="symbol" src="https://ik.imagekit.io/bmp6bnlpn/games/miami_blaze/symbols/symbol-${pay_table.symbol_code}.png?updatedAt=1752504727975" alt="pay table symbol-${pay_table.symbol_number}" />`;

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

    public static async set_currency_symbol(currency: ReelSoftCurrency): Promise<void> {
        try {
            GameShell.currency_prefix = JSON.parse('"' + currency.prefix + '"');
        } catch (e) {
            console.warn('Failed to decode Unicode escape in currency prefix. Using raw prefix.', currency.prefix, e);
            GameShell.currency_prefix = '?';
        }
    }

    /**
     * @param progress      a value between 0 and 1
     */
    public static unity_progress(progress: number): void {
        // const circle_progress_element = document.querySelector<HTMLDivElement>('#unity-loading-bar svg circle');
        // if(!circle_progress_element){
        //     return;
        // }
        //
        // progress = Math.min(1, Math.max(0, progress));
        // const start_size = parseInt(window.getComputedStyle(circle_progress_element).strokeDasharray);
        // circle_progress_element.style.strokeDashoffset = (start_size - (start_size * progress)) + 'px';
    }

    public static on_splash_video_end(){
        GameShell.splash_video_ended = true;
        document.querySelector<HTMLDivElement>('#unity-loading-bar')?.classList.add('fade-out');
    }

    public static async delay(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    public static async init(unityInstance: UnityInstance): Promise<void> {
        while(!GameShell.splash_video_ended){
            await GameShell.delay(200);
        }

        GameShell.unityInstance = unityInstance;
        const diagnostics_icon = document.getElementById('diagnostics-icon');
        // @ts-ignore
        if(diagnostics_icon && unityDiagnostics !== undefined){
            diagnostics_icon.onclick = () => {
                // @ts-ignore
                unityDiagnostics.openDiagnosticsDiv(unityInstance.GetMetricsInfo);
            }
        }

        if(GameShell.lil_gui){
            GameShell.lil_gui.show();
        }

        document.querySelector('#quick-actions')!.classList.add('active');
        document.querySelectorAll<HTMLInputElement>('label.toggle input[type=checkbox]')
            .forEach(i => {
                i.addEventListener('change', () => GameShell.toggle(i));
            })

        // @ts-ignore
        canvas.addEventListener('fullscreenchange', () => {
            GameShell.is_fullscreen = document.fullscreenElement !== null;
        })

    }
}
