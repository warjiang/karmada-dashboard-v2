import { FC, useEffect, useRef } from 'react';
import { getContainerTerminal } from '@/utils/terminal.ts';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalOptions: {
    namespace: string;
    pod: string;
    container: string;
  };
}

const Terminal: FC<TerminalProps> = ({ isOpen, onClose, terminalOptions }) => {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const initRef = useRef(false);
  const terminal = getContainerTerminal(
    terminalOptions.namespace,
    terminalOptions.pod,
    terminalOptions.container,
  );
  useEffect(() => {
    if (initRef.current) return;

    if (!terminalContainerRef.current) return;
    console.log('init terminal');
    console.log(terminal);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    terminal.getSessionId().then(() => {
      terminal.open(terminalContainerRef.current!);
      terminal.connect();
      initRef.current = true;
    });
  }, [terminalContainerRef, terminal]);
  return (
    <div
      style={{
        display: isOpen ? 'block' : 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '30%',
        backgroundColor: 'white',
        zIndex: 9999,
        borderTop: '1px solid #ccc',
      }}
    >
      <div
        ref={terminalContainerRef}
        tabIndex={0}
        style={{
          width: '100vw',
          height: '300px',
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '5px',
          right: '10px',
          zIndex: 10001,
        }}
      >
        Close
      </button>
    </div>
  );
};

export default Terminal;
