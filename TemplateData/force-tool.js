const gui = new lil.GUI();
gui.domElement.style.position = 'fixed';
gui.domElement.style.top = '0';
gui.domElement.style.left = '0';
gui.domElement.style.right = 'unset';
gui.title('Force Tool');
gui.close();
const force_tool_options = {
  'vortex_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 1}),
  '3x_icon_win': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 2}),
  '4x_icon_win': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 3}),
  '5x_icon_win': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 4}),
  'all_wild_win': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 5}),
  'big_win': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 6}),
  'near_miss_3': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 7}),
  'near_miss_4': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 8}),
  'near_miss_5': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 9}),
  'mystery_win_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 10}),
  'mystery_jackpot_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 11}),
  'mini_jackpot_standalone_prize_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 12}),
  'minor_jackpot_standalone_prize_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 13}),
  'major_jackpot_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 14}),
  'all_but_one_jackpot_chance_hfg': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 15}),
}
// gui.add(force_tool_options, 'vortex_hfg').label('Vortex [HFG]');
// gui.add(force_tool_options, '3x_icon_win').label('3x Icon Win');
// gui.add(force_tool_options, '4x_icon_win').label('4x Icon Win');
// gui.add(force_tool_options, '5x_icon_win').label('5x Icon Win');
// gui.add(force_tool_options, 'all_wild_win').label('All Wild Win');
// gui.add(force_tool_options, 'big_win').label('Big Win');
// gui.add(force_tool_options, 'near_miss_3').label('Near Miss 3');
// gui.add(force_tool_options, 'near_miss_4').label('Near Miss 4');
// gui.add(force_tool_options, 'near_miss_5').label('Near Miss 5');
// gui.add(force_tool_options, 'mystery_win_hfg').label('Mystery Win [HFG]');
// gui.add(force_tool_options, 'mystery_jackpot_hfg').label('Mystery Jackpot [HFG]');
// gui.add(force_tool_options, 'mini_jackpot_standalone_prize_hfg').label('Mini Jackpot Standalone Prize [HFG]');
// gui.add(force_tool_options, 'minor_jackpot_standalone_prize_hfg').label('Minor Jackpot Standalone Prize [HFG]');
// gui.add(force_tool_options, 'major_jackpot_hfg').label('Major Jackpot [HFG]');
// gui.add(force_tool_options, 'all_but_one_jackpot_chance_hfg').label('All but 1 Jackpot Chance [HFG]');
gui.add(force_tool_options, 'vortex_hfg');
gui.add(force_tool_options, '3x_icon_win');
gui.add(force_tool_options, '4x_icon_win');
gui.add(force_tool_options, '5x_icon_win');
gui.add(force_tool_options, 'all_wild_win');
gui.add(force_tool_options, 'big_win');
gui.add(force_tool_options, 'near_miss_3');
gui.add(force_tool_options, 'near_miss_4');
gui.add(force_tool_options, 'near_miss_5');
gui.add(force_tool_options, 'mystery_win_hfg');
gui.add(force_tool_options, 'mystery_jackpot_hfg');
gui.add(force_tool_options, 'mini_jackpot_standalone_prize_hfg');
gui.add(force_tool_options, 'minor_jackpot_standalone_prize_hfg');
gui.add(force_tool_options, 'major_jackpot_hfg');
gui.add(force_tool_options, 'all_but_one_jackpot_chance_hfg');
gui.hide();
GameShell.lil_gui = gui;