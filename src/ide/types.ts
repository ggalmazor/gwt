export const IDE_COMMANDS = {
  idea: 'idea',
  rubymine: 'rubymine',
  goland: 'goland',
  webstorm: 'webstorm',
  pycharm: 'pycharm',
  phpstorm: 'phpstorm',
  clion: 'clion',
  rider: 'rider',
} as const;

export type IdeCommand = keyof typeof IDE_COMMANDS;

export const IDE_NAMES: Record<IdeCommand, string> = {
  idea: 'IntelliJ IDEA',
  rubymine: 'RubyMine',
  goland: 'GoLand',
  webstorm: 'WebStorm',
  pycharm: 'PyCharm',
  phpstorm: 'PhpStorm',
  clion: 'CLion',
  rider: 'Rider',
};
