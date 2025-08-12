'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

interface Metadata {
    [key: string]: any;
}

interface Message {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    metadata?: Metadata;
}

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        socket.on('bot-response', (data: { text: string; metadata?: Metadata }) => {

            console.log(data, 'socket-response');

            const message: Message = { role: 'assistant', content: data.text, metadata: data.metadata };

            setMessages((prev) => [...prev, message]);
            setLoading(false);
        });

        return () => {
            socket.off('bot-response');
        };
    }, []);

    const sendMessage = () => {

        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };

        console.log(messages, 'messages');

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        // ❗ Only send clean messages (strip metadata)
        const contextForServer = updatedMessages.map(({ role, content }) => ({
            role,
            content,
        }));

        socket.emit('user-message', {
            query: input,
            context: contextForServer,
        });
    };


    return (
        <section className=' h-screen flex flex-col'>
            <header className='p-[16px_40px] border-b border-solid border-[#EFEFEF] flex items-center justify-between'>
                <h1 className="text-[20px] font-semibold text-[#171D26]">
                    Spurtcommerce Assistant
                </h1>
                <a
                    href=""
                    className='ms-auto text-[14px] h-[32px] leading-[19px] font-normal text-[#FFFFFF] bg-[#171D26] rounded-[8px] p-[6px_12px] hover:bg-black'
                >
                    Login
                </a>
            </header>
            <div className='p-4 flex flex-col grow h-[calc(100%-65px)]'>
                <div className="max-w-[800px] mx-auto flex flex-col h-full">
                    {['', null, undefined, 0].includes(messages.length) && <h1 className='text-[25px] leading-[30px] text-center font-medium text-[#282322] m-[80px_20px_20px]'>Hi there. What's in your mind  today ?</h1>}

                    {/* Chat Messages */}
                    <div className="flex-1 flex flex-col overflow-y-auto pb-[42px] gap-y-6 scrollbar-none">
                        {messages.map((msg, i) =>
                            msg.role !== 'tool' ? (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={` text-sm  leading-[19px] font-normal text-[#171D26]  rounded-[8px] whitespace-pre-wrap capitalize ${msg.role === 'user' ? 'bg-[#F4F4F4] p-[12px] w-max max-w-[80%]' : 'bg-white w-full'
                                            }`}
                                    >
                                        {msg.content}
                                        {msg.metadata?.data?.length > 0 && (
                                            <div className='mt-6 relative after:w-[48px] after:h-full after:inline-block after:absolute after:top-0 after:right-0 after:bg-[linear-gradient(89deg,_#ffffff00_0%,_#ffffff_100%)] overflow-hidden'>
                                                <div className="flex no-wrap gap-[16px] overflow-auto scrollbar-none ">
                                                    {msg.metadata?.data?.map((product: any, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="min-w-[200px] w-[200px] h-[312px] border border-solid border-[#E6E6EB] rounded-[8px] flex flex-col"
                                                        >
                                                            {/* Static image for now */}
                                                            <div className='grow p-[8px_8px_0px_8px]'>
                                                                <img
                                                                    src={product.imageUrl}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                            <div className='p-[8px] mt-auto'>
                                                                <div className="text-[14px] leading-[19px] font-normal text-[#171D26] mb-1 line-clamp-2">{product.name}</div>
                                                                <div className="text-[14px] leading-[19px] font-semibold text-[#171D26] mb-2">₹ {product.price}</div>
                                                                <Link href={product.redirectUrl ?? ''} target="_blank" rel="noopener noreferrer">
                                                                    <button className=" cursor-pointer pt-2 border-t border-solid border-[#E6E6EB] text-[#1168F4] text-[14px] leading-[19px] block w-full hover:underline font-normal">
                                                                        Buy now
                                                                    </button>
                                                                </Link>

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input Box */}
                    <div className='relative  after:h-[48px] after:w-full after:inline-block after:absolute after:bottom-full after:right-0 after:bg-[linear-gradient(180deg,_#ffffff00_0%,_#ffffff_100%)] '>
                        {['', null, undefined, 0].includes(messages.length) && <ul className='flex items-center gap-[8px] flex-wrap justify-center mb-[16px]'>
                            <li><a href="" className='text-[14px] leading-[19px] font-normal text-[#171D26] p-[12px_6px] border border-solid border-[#E6E6EB] rounded-[8px] block w-max'>Which items have the best reviews?</a></li>
                            <li><a href="" className='text-[14px] leading-[19px] font-normal text-[#171D26] p-[12px_6px] border border-solid border-[#E6E6EB] rounded-[8px] block w-max'>What payment methods do you accept?</a></li>
                            <li><a href="" className='text-[14px] leading-[19px] font-normal text-[#171D26] p-[12px_6px] border border-solid border-[#E6E6EB] rounded-[8px] block w-max'>What’s trending right now?</a></li>
                            <li><a href="" className='text-[14px] leading-[19px] font-normal text-[#171D26] p-[12px_6px] border border-solid border-[#E6E6EB] rounded-[8px] block w-max'>Which products are most frequently re-ordered?</a></li>
                            <li><a href="" className='text-[14px] leading-[19px] font-normal text-[#171D26] p-[12px_6px] border border-solid border-[#E6E6EB] rounded-[8px] block w-max'>Which product has high repeat purchase rate?</a></li>
                        </ul>}


                        <div className=" flex flex-col items-end space-y-2 h-[128px] border border-solid
                 border-[#E6E6EB] rounded-[8px] p-[12px]">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Need help? Ask AI Anything!"
                                className="p-0 placeholder:absolute placeholder:top-0 relative m-0 w-full grow text-[14px] leading-[19px] font-normal focus:outline-none focus:shadow-none placeholder:text-[#989898]"
                            />

                            {/* <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                            placeholder="Need help? Ask AI Anything!"
                            className="p-0 placeholder:absolute scrollbar-thin placeholder:top-0 relative m-0 w-full grow text-[14px] leading-[19px] font-normal focus:outline-none focus:shadow-none placeholder:text-[#989898] resize-none"
                        /> */}

                            <button
                                onClick={sendMessage}
                                disabled={loading}
                                className="bg-[#171D26] scrollbar-thin hover:bg-black cursor-pointer w-[36px] h-[36px] min-w-[36px] rounded-full grid place-items-center disabled:opacity-50"
                            >
                                {/* {loading ? 'Thinking…' : 'Send'} */}
                                <img src="/img/send.svg" alt="send" />
                            </button>
                        </div>
                        <p className='text-[12px] leading-[17px] font-normal text-[#999999] mt-[16px] text-center'>By messaging ZayaBot, you agree to our <a href="" className='underline hover:text-[#171D26]'>Terms of Service</a> and have read our <a href="" className='underline hover:text-[#171D26]'>Privacy Policy</a>.</p>

                    </div>
                </div>
            </div>
        </section>

    );
}
