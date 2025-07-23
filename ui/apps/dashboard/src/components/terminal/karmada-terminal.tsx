/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { useEffect, useRef } from 'react';
import { ContainerTerminal, BaseTerminalOptions } from '@karmada/terminal';
import { CreateKarmadaTerminal } from '@/services/terminal.ts';

interface KarmadaTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KarmadaTerminal: React.FC<KarmadaTerminalProps> = ({
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerTerminalRef = useRef<ContainerTerminal | null>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current || containerTerminalRef.current)
      return;
    // async-await function to simplify the code
    void (async () => {
      // create(only if the terminal pod not exist) + inject
      const terminalData = await CreateKarmadaTerminal();
      console.log(terminalData.data);
      const { namespace, podName, container } = terminalData.data;

      // Terminal options
      const terminalOptions: BaseTerminalOptions = {
        xtermOptions: {
          cursorBlink: true,
          scrollback: 1000,
          fontSize: 14,
          // rows: 24,
          // cols: 80,
          theme: {
            background: '#1e1e1e',
            foreground: '#ffffff',
          },
        },
        clientOptions: {
          rendererType: 'webgl',
          disableLeaveAlert: false,
          disableResizeOverlay: false,
          enableZmodem: false,
          enableSixel: false,
          enableTrzsz: false,
          trzszDragInitTimeout: 5000,
          isWindows: false,
          unicodeVersion: '11',
        },
      };
      // 3) Initialize and connect your TtydTerminal
      const terminal = new ContainerTerminal(terminalOptions, {
        // [NOTE] here you should change the namespace、pod、container
        namespace,
        pod: podName,
        container,
        sessionIdUrl:
          '/api/v1/terminal/pod/{{namespace}}/{{pod}}/shell/{{container}}',
        wsUrl: '/api/v1/terminal/sockjs',
      });
      containerTerminalRef.current = terminal;
      terminal
        .getSessionId()
        .then(() => {
          console.log('get sessionId success');
          terminal.open(containerRef.current!);
          terminal.connect();
        })
        .catch((err) => {
          console.error('get sessionId error', err);
        });
    })();
  }, [isOpen]);

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
        ref={containerRef}
        tabIndex={0}
        style={{ width: '100%', height: '100%' }}
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

export default KarmadaTerminal;
