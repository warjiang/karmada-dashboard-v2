import {
  ClientOptions,
  ContainerTerminal,
  ITerminalOptions,
  ITheme,
} from '@karmada/terminal';

const clientOptions = {
  rendererType: 'webgl',
  disableLeaveAlert: false,
  disableResizeOverlay: false,
  enableZmodem: false,
  enableTrzsz: true,
  enableSixel: false,
  isWindows: false,
  unicodeVersion: '11',
} as unknown as ClientOptions;

const termOptions = {
  fontSize: 13,
  fontFamily: 'Consolas,Liberation Mono,Menlo,Courier,monospace',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  theme: {
    foreground: '#d2d2d2',
    background: '#2b2b2b',
    cursor: '#adadad',
    black: '#000000',
    red: '#d81e00',
    green: '#5ea702',
    yellow: '#cfae00',
    blue: '#427ab3',
    magenta: '#89658e',
    cyan: '#00a7aa',
    white: '#dbded8',
    brightBlack: '#686a66',
    brightRed: '#f54235',
    brightGreen: '#99e343',
    brightYellow: '#fdeb61',
    brightBlue: '#84b0d8',
    brightMagenta: '#bc94b7',
    brightCyan: '#37e6e8',
    brightWhite: '#f1f1f0',
  } as ITheme,
  allowProposedApi: true,
} as unknown as ITerminalOptions;

/*
export const containerTerminal = new ContainerTerminal(
    {
        clientOptions: clientOptions,
        xtermOptions: termOptions,
    },
    {
        // [NOTE] here you should change the namespace、pod、container
        namespace: "karmada-system",
        pod: "karmada-ttyd-admin",
        container: "karmada-ttyd-admin",
        sessionIdUrl: '/api/v1/terminal/pod/{{namespace}}/{{pod}}/shell/{{container}}',
        wsUrl: "/api/v1/terminal/sockjs"
    },
);
*/
const containerTerminalMap: Record<string, ContainerTerminal> = {};
export function getContainerTerminal(
  namespace: string,
  pod: string,
  container: string,
): ContainerTerminal {
  const containerTerminalKey = `${namespace}-${pod}-${container}`;
  if (!containerTerminalMap[containerTerminalKey]) {
    containerTerminalMap[containerTerminalKey] = new ContainerTerminal(
      {
        clientOptions: clientOptions,
        xtermOptions: termOptions,
      },
      {
        // [NOTE] here you should change the namespace、pod、container
        namespace,
        pod,
        container,
        sessionIdUrl:
          '/api/v1/terminal/pod/{{namespace}}/{{pod}}/shell/{{container}}',
        wsUrl: '/api/v1/terminal/sockjs',
      },
    );
  }
  return containerTerminalMap[containerTerminalKey];
}
