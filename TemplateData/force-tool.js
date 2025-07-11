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
  'near_miss_5': () => GameShell.send_message_to_unity('forceToolUse', {forceToolId: 9})
}
gui.add(force_tool_options, 'vortex_hfg');
gui.add(force_tool_options, '3x_icon_win');
gui.add(force_tool_options, '4x_icon_win');
gui.add(force_tool_options, '5x_icon_win');
gui.add(force_tool_options, 'all_wild_win');
gui.add(force_tool_options, 'big_win');
gui.add(force_tool_options, 'near_miss_3');
gui.add(force_tool_options, 'near_miss_4');
gui.add(force_tool_options, 'near_miss_5');
gui.hide();
GameShell.lil_gui = gui;