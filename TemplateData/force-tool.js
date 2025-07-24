window.addEventListener('game_is_spinning', () => {
    if(!GameShell || !GameShell.lil_gui) return;
    GameShell.lil_gui.controllers.forEach(i => i.enable(false))
})
window.addEventListener('game_is_not_spinning', () => {
    if(!GameShell || !GameShell.lil_gui) return;
    GameShell.lil_gui.controllers.forEach(i => i.enable(true))
})
const gui = new lil.GUI();
gui.domElement.style.position = 'fixed';
gui.domElement.style.top = '0';
gui.domElement.style.left = '0';
gui.domElement.style.right = 'unset';
gui.title('Force Tool');
gui.close();
const force_tool_options = [
    'Vortex [HFG]',                               // 1
    '3x Icon Win',                                // 2
    '4x Icon Win',                                // 3
    '5x Icon Win',                                // 4
    'All Wild Win',                               // 5
    'Big Win',                                    // 6
    'Near Miss 3',                                // 7
    'Near Miss 4',                                // 8
    'Near Miss 5',                                // 9
    'Mystery Win [HFG]',                          // 10
    'Mystery Jackpot [HFG]',                      // 11
    'Mini Jackpot Standalone Prize [HFG]',        // 12
    'Minor Jackpot Standalone Prize [HFG]',       // 13
    'Major Jackpot [HFG]',                        // 14
    'All but 1 Jackpot Chance [HFG]'              // 15
];
force_tool_options.forEach((name, index) => {
    gui.add({'callback':() => GameShell.send_message_to_unity('forceToolUse', {forceToolId: index+1})}, 'callback').name(name);
});
gui.hide();
window.addEventListener('player_enters_game', () => {
    gui.show();
})