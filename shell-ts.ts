import GUI from 'lil-gui';
class GameShell {
    static unityInstance: object;
    static lil_gui: GUI

    public static init(unityInstance: object) {
        this.unityInstance = unityInstance;
        document.querySelector<HTMLDivElement>('#unity-loading-bar')!.style.display = 'none';
        // TODO: create these dynamically
        document.querySelector<HTMLElement>('#quick-actions')!.style.visibility = 'visible';
        document
            .querySelectorAll<HTMLInputElement>('label.toggle input[type=checkbox]')
            .forEach(i => {
                i.addEventListener('change', () => GameShell.toggle(i));
            })
        document
            .querySelectorAll('.action[data-action]')
            .forEach(i => {
                i.addEventListener('click', () => GameShell.do_action(i.dataset.action));
            })
        if(GameShell.lil_gui){
            GameShell.lil_gui.show();
        }
    }

    public static toggle(t: HTMLInputElement) {
        const parent = t.parentNode! as HTMLElement;
        const callback_name = parent.dataset.callback;

        if(!callback_name){
            return;
        }

        // @ts-ignore
        const method_to_call = GameShell[callback_name];
        if(method_to_call === undefined){
            return;
        }

        try {
            method_to_call()
        } catch (ex){
            console.warn(ex);
        }
    }

    public static do_action(action_name: keyof typeof GameShell) {
        if (GameShell[action_name] === undefined) {
            console.log('cannot find action', action_name)
            return;
        }
        GameShell[action_name]();
    }
}

// TODO: remove this once all alerts have been remove from the unity end
window.alert = (message) => {
    console.log('Alert Swallowed:', message);
}