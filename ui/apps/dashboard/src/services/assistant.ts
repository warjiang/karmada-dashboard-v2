import { fetchEventSource } from '@microsoft/fetch-event-source';

export const getAssistantStream = (
  message: string,
  onMessage: (data: string) => void,
  onError: (error: any) => void,
  onClose: () => void,
) => {
  fetchEventSource('/api/v1/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
    onmessage(ev: { data: string }) {
      onMessage(ev.data);
    },
    onerror(err: any) {
      onError(err);
    },
    onclose() {
      onClose();
    },
  });
};