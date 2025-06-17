"use client";

import { useState, useEffect } from "react";

const ranks = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
const suits = ["h","d","c","s"];

function createDeck(): string[] {
  const deck: string[] = [];
  for (const r of ranks) {
    for (const s of suits) deck.push(r + s);
  }
  return deck;
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function Home() {
  const [deck, setDeck] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [aiCards, setAiCards] = useState<string[]>([]);
  const [board, setBoard] = useState<string[]>([]);
  const [past, setPast] = useState<string[]>([]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [log, setLog] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');

  useEffect(() => {
    startHand();
  }, []);

  function startHand() {
    const d = shuffle(createDeck());
    const p = [d.pop()!, d.pop()!];
    const a = [d.pop()!, d.pop()!];
    setDeck(d);
    setPlayerCards(p);
    setAiCards(a);
    setBoard([]);
    setPast([]);
    setTurn('player');
    setLog([`You are dealt ${p.join(' ')}`]);
    setAiResponse('');
  }

  function addAction(actor: 'You' | 'AI', action: string) {
    setPast(prev => [...prev, action]);
    setLog(prev => [...prev, `${actor}: ${action}`]);
  }

  async function aiMove() {
    const body = {
      turn: 'P1',
      seen: aiCards.join('') + '~' + board.join(''),
      past,
    };
    try {
      const res = await fetch('http://127.0.0.1:8888/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setAiResponse(JSON.stringify(json, null, 2));
      if (Array.isArray(json) && json.length > 0) {
        const best = json.reduce((a: any, b: any) => (b.mass > a.mass ? b : a));
        let action = best.edge;
        let translated = '';
        if (action === 'O') translated = 'CHECK';
        else if (action === '*') translated = 'CALL';
        else if (action === 'F') translated = 'FOLD';
        else if (action === '!') translated = 'SHOVE';
        else if (action.startsWith('+')) translated = `RAISE ${action}`;
        else if (action.startsWith('-')) translated = `RAISE ${action}`;
        else translated = action;
        addAction('AI', translated);
      }
    } catch (e) {
      setAiResponse('Error contacting server');
    }
    setTurn('player');
  }

  const handlePlayer = (action: string) => {
    addAction('You', action);
    setTurn('ai');
  };

  useEffect(() => {
    if (turn === 'ai') aiMove();
  }, [turn]);

  const dealFlop = () => {
    if (board.length === 0 && deck.length >= 3) {
      const cards = [deck.pop()!, deck.pop()!, deck.pop()!];
      setBoard(cards);
      handlePlayer(`DEAL ${cards.join(' ')}`);
    }
  };

  const dealTurn = () => {
    if (board.length === 3 && deck.length >= 1) {
      const card = deck.pop()!;
      setBoard(prev => [...prev, card]);
      handlePlayer(`DEAL ${card}`);
    }
  };

  const dealRiver = () => {
    if (board.length === 4 && deck.length >= 1) {
      const card = deck.pop()!;
      setBoard(prev => [...prev, card]);
      handlePlayer(`DEAL ${card}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Poker vs AI</h1>
      <div className="flex gap-4">
        <button className="border px-2" onClick={startHand}>New Hand</button>
        <button className="border px-2" onClick={dealFlop}>Deal Flop</button>
        <button className="border px-2" onClick={dealTurn}>Deal Turn</button>
        <button className="border px-2" onClick={dealRiver}>Deal River</button>
      </div>
      <div>Your cards: {playerCards.join(' ')}</div>
      <div>Board: {board.join(' ') || '-'}</div>
      <div className="flex gap-2">
        <button className="border px-2" onClick={() => handlePlayer('CHECK')}>Check</button>
        <button className="border px-2" onClick={() => handlePlayer('CALL')}>Call</button>
        <button className="border px-2" onClick={() => handlePlayer('FOLD')}>Fold</button>
        <button className="border px-2" onClick={() => handlePlayer('RAISE 5')}>Raise 5</button>
      </div>
      <pre className="bg-gray-100 p-2 h-40 overflow-y-auto">{log.join('\n')}</pre>
      {aiResponse && (
        <div>
          <h2 className="font-semibold">AI Blueprint</h2>
          <pre className="bg-gray-100 p-2 overflow-x-auto">{aiResponse}</pre>
        </div>
      )}
    </div>
  );
}

