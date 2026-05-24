'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  // 重新通过 useState 自行管理输入框状态
  const [input, setInput] = useState('');

  // 从 useChat 中解构全新的 sendMessage 方法
  const { messages, sendMessage } = useChat();

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="flex-1 space-y-4 mb-20">
        {messages.map((message) => (
          <div
            key={message.id}
            className="whitespace-pre-wrap p-4 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
          >
            <div className="font-bold mb-1">
              {message.role === 'user' ? '😎 User: ' : '🤖 AI: '}
            </div>

            {/* 核心渲染：解构流中的标准组件类型 */}
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return (
                    <div
                      key={`${message.id}-${i}`}
                      className="text-zinc-800 dark:text-zinc-200"
                    >
                      {part.text}
                    </div>
                  );

                case 'reasoning':
                  return (
                    <div
                      key={`${message.id}-${i}`}
                      className="text-sm text-zinc-400 italic border-l-2 border-zinc-300 pl-2 my-2"
                    >
                      思考中: {part.text}
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        ))}
      </div>

      {/* 3. 🌟 5.0 标准：手动接管 onSubmit 事件并调用 sendMessage */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!input.trim()) return;

          const textToSend = input;
          setInput(''); // 乐观清空输入框

          // 对齐 5.0 签名：sendMessage({ text: string })
          await sendMessage({ text: textToSend });
        }}
        className="fixed bottom-0 w-full max-w-md bg-white dark:bg-black py-4"
      >
        <input
          className="w-full p-2 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl dark:bg-zinc-900"
          value={input}
          placeholder="试试问：What's the weather in New York in celsius?"
          onChange={(e) => setInput(e.target.value)} // 重新手动控制
        />
      </form>
    </div>
  );
}
