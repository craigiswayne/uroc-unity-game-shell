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
    multipliers: { count: number, base_payout: number, payout_for_bet_amount: string}[]
}

interface RawPayTables {
    symbol: number,
    count: number,
    payout: number
}

type AvailableDialogs = 'game_rules' | 'quit_modal' | 'language_modal' | 'error_modal' | 'bet_levels_modal';

const reelsoft_number_to_normal_number = (number: number): string => {
    return (number / 100).toFixed(2);
}

const my_template_config = {
    asset_domain: 'https://ik.imagekit.io/bmp6bnlpn',
    cache_bust_params: Date.now().toString()
};

class GameShell {
    public static unityInstance?: UnityInstance;
    public static rtp = 100;
    public static current_language = 'en';
    public static currency_prefix = '';
    public static default_bet = '0.00';
    public static current_bet = '0.00';
    public static bet_levels: { with_decimals: string, raw: number }[] = [];
    public static pay_tables: FormattedPayTables[] = [];
    public static asset_url = '';
    public static splash_progress = 0;
    public static unity_progress = 0;
    public static is_spinning = false;
    public static open_game_data: ReelSoftOpenGameData;

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

    public static get_dialog_by_id(id_selector: AvailableDialogs): HTMLDialogElement {
        return document.querySelector<HTMLDialogElement>(`dialog#${id_selector}.fugaso`)!;
    }

    public static show_dialog_by_id(id_selector: AvailableDialogs) {
        /**
         * Prevent ALL modals from showing
         */
        if(GameShell.is_spinning) {
            return;
        }
        const dialog = GameShell.get_dialog_by_id(id_selector);
        dialog.addEventListener('click', GameShell.handle_backdrop_click);
        dialog.showModal();
        GameShell.collapse_quick_actions();
    }

    public static close_dialog_by_id(id_selector: AvailableDialogs) {
        const dialog = GameShell.get_dialog_by_id(id_selector);
        dialog.removeEventListener('click', GameShell.handle_backdrop_click);
        dialog.close();
    }

    public static get_unity_canvas(): HTMLCanvasElement {
        return document.querySelector<HTMLCanvasElement>('#unity-canvas')!;
    }

    public static is_fullscreen() {
        return document.querySelector<HTMLInputElement>('#full_screen_status')!.checked;
    }

    public static toggle_fullscreen_native() {
        if (document.fullscreenElement === null) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else {
                GameShell.toggle_fullscreen_with_unity();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                document.querySelector<HTMLInputElement>('#full_screen_status')!.checked = false
            } else {
                GameShell.toggle_fullscreen_with_unity();
            }
        }
    }

    public static toggle_fullscreen_with_unity() {
        if (!GameShell.unityInstance) {
            console.log('No unity instance to toggle fullscreen on.')
            return;
        }
        if (!GameShell.is_fullscreen()) {
            GameShell.unityInstance.SetFullscreen(1);
        } else {
            GameShell.unityInstance.SetFullscreen(0);
        }
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
            i.src = `${my_template_config.asset_domain}/flags/${language_code}.svg?${my_template_config.cache_bust_params}`;
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
        GameShell.format_pay_tables()
            .then(GameShell.populate_pay_tables)
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

    public static async format_pay_tables(): Promise<FormattedPayTables[]> {
        if(GameShell.open_game_data.payTable === undefined){
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

        GameShell.open_game_data.payTable.forEach(item => {
            // don't care about 0 payouts
            if(item.payout === 0){
                return;
            }

            const payout_factor_based_on_bet = parseFloat(GameShell.current_bet) / parseFloat(GameShell.default_bet);

            const multiplier_data = {
                count: item.count,
                base_payout: item.payout,
                payout_for_bet_amount: (item.payout * parseFloat(GameShell.current_bet)).toFixed(2)
            }

            const existing_group_index = result.findIndex( i => i.symbol_number === item.symbol);
            if(existing_group_index !== -1){
                result[existing_group_index].multipliers.push(multiplier_data)
            } else {
                const new_group = {
                    symbol_number: item.symbol,
                    symbol_code: symbol_map[item.symbol] ?? 'unknown',
                    multipliers: [multiplier_data]
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
            symbol_container.innerHTML = `<img class="symbol" src="${my_template_config.asset_domain}/games/miami_blaze/symbols/symbol-${pay_table.symbol_code}.png?updatedAt=${my_template_config.cache_bust_params}" alt="pay table symbol-${pay_table.symbol_number}" />`;

            const data_container = document.createElement('div');
            data_container.className = 'data';
            pay_table.multipliers.forEach(row => {
                data_container.innerHTML += `
                     <div class="row">
                         <div class="count">x${row.count}</div>
                         <div class="multiplier">${row.payout_for_bet_amount}</div>
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

    public static update_progress_loader(): void {
        const circle_progress_element = document.querySelector<HTMLDivElement>('#splash svg circle');
        if(!circle_progress_element){
            return;
        }
        const average_progress = (GameShell.splash_progress + GameShell.unity_progress)/2;
        const start_size = parseInt(window.getComputedStyle(circle_progress_element).strokeDasharray);
        circle_progress_element.style.strokeDashoffset = (start_size - (start_size * average_progress)) + 'px';
    }

    public static async on_splash_video_end(): Promise<void> {
        // give the splash a bit more time to finish
        await GameShell.delay(1000);
        GameShell.splash_progress = 1;
    }

    public static async on_splash_video_progress(element: HTMLVideoElement): Promise<void> {
        const currentTime = element.currentTime;
        const duration = element.duration;
        GameShell.splash_progress = currentTime / duration;
        GameShell.update_progress_loader()
    }

    public static async handle_escape_key(event: KeyboardEvent){
        if (event.key !== 'Escape' && event.code !== 'Escape' && event.keyCode !== 27) {
            return
        }

        event.preventDefault();
        event.stopPropagation();
    }

    public static async handle_backdrop_click(event: MouseEvent): Promise<void> {
        const dialog = event.target as HTMLDialogElement;
        if (event.target !== dialog) {
            console.log("Backdrop clicked, but dialog dismissal prevented.");
        }
    }

    public static async delay(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Player clicked on the game intro
     * i.e. the "click to continue" screen"
     * So we want to show the quick actions and perhaps only show the force tool here
     */
    public static async player_enters_game(){
        document.querySelector('#quick-actions')!.classList.add('active');
        /**
         * Currently this is only used on the force tool end
         */
        const custom_event = new CustomEvent('player_enters_game', {
            bubbles: false,
            cancelable: false
        });
        window.dispatchEvent(custom_event);

        // we only want to trigger this event once
        GameShell.get_unity_canvas().removeEventListener('pointerdown', GameShell.player_enters_game);
    }

    public static async init(unityInstance: UnityInstance): Promise<void> {
        GameShell.get_unity_canvas().addEventListener('pointerdown', GameShell.player_enters_game)
        GameShell.unity_progress = 1;
        while(GameShell.splash_progress !== 1){
            await GameShell.delay(200);
        }

        document.querySelector<HTMLDivElement>('#splash')?.classList.add('fade-out');
        setTimeout(() => {
            document.querySelector<HTMLDivElement>('#splash')?.remove();
        }, 800);

        GameShell.unityInstance = unityInstance;
        const diagnostics_icon = document.getElementById('diagnostics-icon');
        // @ts-ignore
        if(diagnostics_icon && unityDiagnostics !== undefined){
            diagnostics_icon.onclick = () => {
                // @ts-ignore
                unityDiagnostics.openDiagnosticsDiv(unityInstance.GetMetricsInfo);
            }
        }


        document.querySelectorAll<HTMLInputElement>('label.toggle input[type=checkbox]')
            .forEach(i => {
                i.addEventListener('change', () => GameShell.toggle(i));
            })

        // // @ts-ignore
        document.addEventListener('fullscreenchange', (event) => {
            // GameShell.toggle_fullscreen_native();
            console.log('event', event);
        })

    }
}


// @ts-ignore
window.addEventListener('bet_changed', (bet_changed_event: CustomEvent<{amount: number}>) => {
    GameShell.set_bet(reelsoft_number_to_normal_number(bet_changed_event.detail.amount));
})

window.addEventListener('time_out', () => GameShell.show_error_popup('Your session has timed out'))

window.addEventListener('game_is_spinning', () => {
    GameShell.is_spinning = true;
    document.querySelectorAll<HTMLButtonElement>('button.disable_on_spin').forEach(async button => {
        button.disabled = true;
    })
})

window.addEventListener('game_is_not_spinning', () => {
    GameShell.is_spinning = false;
    document.querySelectorAll<HTMLButtonElement>('button.disable_on_spin').forEach(async button => {
        button.disabled = false;
    })
})

window.addEventListener('change_bet_amount', () => GameShell.show_dialog_by_id('bet_levels_modal'));

// @ts-ignore
window.addEventListener('open_game_data', (open_game_data: CustomEvent<ReelSoftOpenGameData>) => {
    GameShell.open_game_data = open_game_data.detail;
    GameShell.current_bet = reelsoft_number_to_normal_number(GameShell.open_game_data.defaultBet);
    GameShell.default_bet = reelsoft_number_to_normal_number(GameShell.open_game_data.defaultBet);
    GameShell.bet_levels = GameShell.open_game_data.betLevels.map((i: number) => {
        return {
            with_decimals: reelsoft_number_to_normal_number(i),
            raw: i
        }
    });

    GameShell.set_currency_symbol(GameShell.open_game_data.currency)
        .then(GameShell.populate_bet_levels);
    GameShell.format_pay_tables()
        .then(GameShell.populate_pay_tables);

    GameShell.update_rtp(GameShell.open_game_data.rtpVersion);
})

document.addEventListener('keydown', GameShell.handle_escape_key, true); // 'true' for capture phase