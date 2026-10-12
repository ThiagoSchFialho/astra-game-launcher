import { useEffect, useState } from 'react';
import type { GameEvent } from '../types/gameEvents';

export function useRunningGame() {
    const [runningSteamId, setRunningSteamId] = useState<number | null>(null);

    useEffect(() => {
        const es = new EventSource(`${import.meta.env.VITE_BACKEND_HOST}/game-events`);

        es.onmessage = (e) => {
            const event: GameEvent = JSON.parse(e.data);
            setRunningSteamId(event.type === 'started' ? event.steamId : null);
        };

        return () => es.close();
    }, []);

    return runningSteamId;
}