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

import React, { useEffect, useRef, useState } from 'react';
import { BaseTerminalOptions, TtydTerminal } from '@karmada/terminal';
import { Button, Spin } from 'antd';
import { Icons } from '@/components/icons';

interface KarmadaTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KarmadaTerminal: React.FC<KarmadaTerminalProps> = ({
  isOpen,
  onClose,
}) => {
  const ttydRef = useRef<HTMLDivElement | null>(null);
  const ttydTerminalRef = useRef<TtydTerminal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !ttydRef.current || ttydTerminalRef.current) {
      return;
    }
    setIsLoading(true);
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
        enableTrzsz: true,
        trzszDragInitTimeout: 5000,
        isWindows: false,
        unicodeVersion: '11',
      },
    };
    // 3) Initialize and connect your TtydTerminal

    const wsUrl = 'ws://localhost:5173/ws';
    const tokenUrl = 'http://localhost:5173/token';
    const terminal = new TtydTerminal(terminalOptions, {
      tokenUrl,
      wsUrl,
      flowControl: {
        limit: 100000,
        highWater: 10,
        lowWater: 4,
      },
    });
    ttydTerminalRef.current = terminal;

    terminal.open(ttydRef.current);
    terminal.connect();
    setIsLoading(false);
  }, [isOpen, setIsLoading]);

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
      <Spin
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        spinning={isLoading}
      />
      <div
        style={{
          width: '100%',
          height: '20px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          type="link"
          icon={<Icons.close width={16} height={16} color={'#000000'} />}
          style={{ justifySelf: 'right' }}
          onClick={onClose}
        ></Button>
      </div>
      <div
        ref={ttydRef}
        style={{
          width: '100%',
          height: 'calc(100% - 20px)',
          visibility: !isLoading ? 'visible' : 'hidden',
        }}
      />
    </div>
  );
};

export default KarmadaTerminal;
