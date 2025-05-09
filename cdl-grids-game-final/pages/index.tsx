import { useEffect, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface Player {
  name: string;
  image: string;
  teams: string[];
  roles: string[];
  kd: number;
  maps: string[];
}

const fetchPlayers = async (): Promise<Player[]> => {
  const res = await fetch('/api/players');
  return await res.json();
};

const fetchCategories = async (): Promise<string[]> => {
  const res = await fetch('/api/categories');
  return await res.json();
};

const isCorrectMatch = (p: Player, condition: string): boolean => {
  if (!p || !condition) return false;
  if (condition === 'Played for OpTic') return p.teams.includes('OpTic');
  if (condition === 'Played for FaZe') return p.teams.includes('FaZe');
  if (condition === 'Used AR on Fortress') return p.roles.includes('AR') && p.maps.includes('Fortress');
  if (condition === 'K/D over 1.1') return p.kd > 1.1;
  if (condition === 'Played SMG on Embassy') return p.roles.includes('SMG') && p.maps.includes('Embassy');
  if (condition === 'Played on Hotel') return p.maps.includes('Hotel');
  if (condition === 'Flex Role on Expo') return p.roles.includes('Flex') && p.maps.includes('Expo');
  if (condition === 'Used SMG for NYSL') return p.teams.includes('NYSL') && p.roles.includes('SMG');
  if (condition === 'Played with Scump') return p.teams.includes('OpTic') && p.name !== 'Scump';
  return false;
};

const GuessCard = ({ player, correct }: { player: Player; correct: boolean }) => (
  <div className={clsx(
    'rounded overflow-hidden shadow bg-zinc-800 p-2 flex flex-col items-center justify-center text-center transition-all',
    correct ? 'border-2 border-green-500' : 'border-2 border-red-500'
  )}>
    <Image src={player.image} width={72} height={72} alt={player.name} className="rounded-full" />
    <p className="mt-2 text-xs font-semibold text-white">{player.name}</p>
  </div>
);

const GuessCell = ({ row, col, players, onStrike }: { row: string; col: string; players: Player[]; onStrike: () => void }) => {
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  const handleGuess = () => {
    const found = players.find(p => p.name.toLowerCase() === guess.toLowerCase());
    if (!found) return;
    const valid = isCorrectMatch(found, row) && isCorrectMatch(found, col);
    setResult(valid ? 'correct' : 'wrong');
    setPlayer(found);
    if (!valid) onStrike();
  };

  return (
    <div className="aspect-square p-2 bg-zinc-900 rounded border border-zinc-700 flex flex-col items-center justify-center">
      {!player ? (
        <>
          <input
            className="bg-zinc-800 text-white text-xs px-2 py-1 rounded w-full text-center"
            placeholder="Enter player"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <button onClick={handleGuess} className="mt-1 w-full text-xs bg-blue-600 px-2 py-1 rounded">
            Submit
          </button>
        </>
      ) : (
        <GuessCard player={player} correct={result === 'correct'} />
      )}
    </div>
  );
};

const GameGrid = ({
  players,
  rows,
  cols,
  onStrike
}: {
  players: Player[];
  rows: string[];
  cols: string[];
  onStrike: () => void;
}) => (
  <div className="grid border border-zinc-700" style={{ gridTemplateColumns: `repeat(${cols.length + 1}, minmax(100px, 1fr))` }}>
    <div className="bg-zinc-900"></div>
    {cols.map((c, i) => (
      <div key={i} className="text-xs text-center font-semibold text-zinc-300 border border-zinc-700 px-1 py-2 bg-zinc-800">
        {c}
      </div>
    ))}
    {rows.map((r, i) => (
      <>
        <div
          key={`r${i}`}
          className="text-xs text-center font-semibold text-zinc-300 border border-zinc-700 px-1 py-2 bg-zinc-800"
        >
          {r}
        </div>
        {cols.map((c, j) => (
          <GuessCell key={`${i}-${j}`} row={r} col={c} players={players} onStrike={onStrike} />
        ))}
      </>
    ))}
  </div>
);

const Header = ({ mode, reset, strikes }: { mode: 'easy' | 'hard'; reset: () => void; strikes: number }) => (
  <header className="flex items-center justify-between px-6 py-4 bg-zinc-800 shadow">
    <h1 className="text-xl font-bold">CDL Grids - {mode.toUpperCase()} MODE</h1>
    <div className="text-sm text-red-400">Strikes: {strikes} / 3</div>
    <button className="bg-yellow-600 px-4 py-2 rounded font-semibold" onClick={reset}>New Game</button>
  </header>
);

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [mode, setMode] = useState<'easy' | 'hard' | null>(null);
  const [strikes, setStrikes] = useState(0);

  useEffect(() => {
    if (mode) {
      fetchPlayers().then(setPlayers);
      fetchCategories().then(setCategories);
    }
  }, [mode]);

  const resetGame = () => {
    setMode(null);
    setStrikes(0);
  };

  const handleStrike = () => {
    setStrikes((s) => s + 1);
  };

  const size = mode === 'easy' ? 3 : 5;
  const rows = categories.slice(0, size);
  const cols = categories.slice(size, size * 2);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white">
      {mode ? (
        <>
          <Header mode={mode} reset={resetGame} strikes={strikes} />
          <section className="p-6 space-y-6">
            {strikes >= 3 ? (
              <div className="text-center text-red-500 text-lg font-bold">Game Over — Too Many Strikes!</div>
            ) : (
              <GameGrid players={players} rows={rows} cols={cols} onStrike={handleStrike} />
            )}
          </section>
        </>
      ) : (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
          <h1 className="text-4xl font-bold tracking-tight">🧩 CDL Grids</h1>
          <p className="text-lg text-zinc-400">Choose difficulty:</p>
          <div className="flex gap-4">
            <button className="bg-green-600 px-6 py-3 rounded font-semibold" onClick={() => setMode('easy')}>Bot (3x3)</button>
            <button className="bg-red-600 px-6 py-3 rounded font-semibold" onClick={() => setMode('hard')}>Vet (5x5)</button>
          </div>
        </div>
      )}
    </main>
  );
}