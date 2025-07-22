import React, { useState, useRef } from 'react';
import { Input, Button, List } from 'antd';
import { Icons } from '@/components/icons';
import { getAssistantStream } from '@/services/assistant';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const botMessageRef = useRef<Message | null>(null);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = { text: inputValue, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');

    const botMessage: Message = { text: '', sender: 'bot' };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
    botMessageRef.current = botMessage;

    getAssistantStream(
      inputValue,
      (data) => {
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot') {
            lastMessage.text += data;
          }
          return newMessages;
        });
      },
      (error) => {
        console.error('Stream error:', error);
      },
      () => {
        botMessageRef.current = null;
      }
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <List
        dataSource={messages}
        renderItem={(item) => (
          <List.Item style={{ textAlign: item.sender === 'user' ? 'right' : 'left' }}>
            <List.Item.Meta
              avatar={item.sender === 'bot' ? <Icons.bot /> : <Icons.user />}
              title={item.sender}
              description={item.text}
            />
          </List.Item>
        )}
      />
      <div style={{ display: 'flex', marginTop: '20px' }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSendMessage}
          placeholder="Type your message..."
        />
        <Button onClick={handleSendMessage} type="primary" style={{ marginLeft: '10px' }}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default AssistantPage;