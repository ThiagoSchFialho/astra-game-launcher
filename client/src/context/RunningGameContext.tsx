import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { GameEvent } from '../types/gameEvents';
import { useDb } from '../hooks/useDb';

const RunningGameContext = createContext<number | null>(null);

export const RunningGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [runningSteamId, setRunningSteamId] = useState<number | null>(null);
    const { syncAchievementsBySteamId } = useDb();

    const syncRef = useRef(syncAchievementsBySteamId);
    syncRef.current = syncAchievementsBySteamId;

    useEffect(() => {
        const es = new EventSource(`${import.meta.env.VITE_BACKEND_HOST}/game-events`);

        es.onmessage = (e) => {
            const event: GameEvent = JSON.parse(e.data);

            if (event.type === 'started') {
                setRunningSteamId(event.steamId);
            } else {
                setRunningSteamId(null);
                syncRef.current(String(event.steamId));
            }
        };

        return () => es.close();
    }, []);

    return (
        <RunningGameContext.Provider value={runningSteamId}>
            {children}
        </RunningGameContext.Provider>
    );
};

export const useRunningGame = () => useContext(RunningGameContext);