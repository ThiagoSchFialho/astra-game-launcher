const formatDateWithTimezone = (date: Date): string => {
    const pad = (n: number, size = 2) => String(n).padStart(size, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);

    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = pad(Math.floor(absOffset / 60));
    const offsetMins = pad(absOffset % 60);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms} ${sign}${offsetHours}${offsetMins}`;
};

export const useDb = () => {
    const host = import.meta.env.VITE_BACKEND_HOST;

    const fetchGames = async () => {
        try {
            const response = await fetch (`${host}/games`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao carregar jogos.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao carregar jogos.", error);
        }
    }

    const handleStartGame = async (id: string, steamId: string) => {
        const now = formatDateWithTimezone(new Date());
        await updateRTimeLastPlayed(id, now);
        window.location.href = `steam://rungameid/${steamId}`;
    };

    const getGameById = async (id: string) => {
        try {
            const response = await fetch (`${host}/games/${id}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao carregar jogos.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao carregar jogos.", error);
        }
    }

    const updateStatus = async (id: string, status: string) => {
        try {
            const response = await fetch (`${host}/games/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao atualizar status.", data.error);
                return null;
            }

            return data;
        } catch (error) {
            console.error("Erro ao atualizar status.", error);
        }
    }

    const updateHidden = async (id: string, isHidden: boolean) => {
        try {
            const response = await fetch (`${host}/games/${id}/hidden`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hidden: !isHidden })
            });
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao atualizar jogo.", data.error);
                return null;
            }

            return data;
        } catch (error) {
            console.error("Erro ao atualizar jogo.", error);
        }
    }

    const updateBeatable = async (id: string, isBeatable: boolean) => {
        try {
            const response = await fetch (`${host}/games/${id}/beatable`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ beatable: !isBeatable })
            });
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao atualizar jogo.", data.error);
                return null;
            }

            return data;
        } catch (error) {
            console.error("Erro ao atualizar jogo.", error);
        }
    }

    const updateRTimeLastPlayed = async (id: string, rtime_last_played: string) => {
        try {
            const response = await fetch (`${host}/games/${id}/rtime_last_played`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rtime_last_played: rtime_last_played })
            });
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao atualizar jogo.", data.error);
                return null;
            }

            return data;
        } catch (error) {
            console.error("Erro ao atualizar jogo.", error);
        }
    }

    const syncSteam = async () => {
        try {
            const response = await fetch (`${host}/steam-api/sync-and-update-games-from-steam`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao sincronizar jogos.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao sincronizar jogos.", error);
        }
    }

    const syncPlaytime = async () => {
        try {
            const response = await fetch (`${host}/steam-api/sync-playtime-from-steam`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao sincronizar playtime.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao sincronizar playtime.", error);
        }
    }

    const syncRtimeLastPlayed = async () => {
        try {
            const response = await fetch (`${host}/steam-api/sync-rtime-last-played-from-steam`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao sincronizar rtime_last_played.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao sincronizar rtime_last_played.", error);
        }
    }

    const getAchievements = async (gameId: string) => {
        try {
            const response = await fetch (`${host}/achievements/${gameId}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao carregar conquistas.", data.error ?? data.message);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao carregar conquistas.", error);
        }
    }

    const getAchievementsProgress = async (gameId?: string) => {
        const path = gameId ? `/achievements/progress/${gameId}` : `/achievements/progress`;

        try {
            const response = await fetch (`${host}${path}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao carregar progresso de conquistas.", data.error ?? data.message);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao carregar progresso de conquistas.", error);
        }
    }

    const syncAchievements = async () => {
        try {
            const response = await fetch (`${host}/steam-api/sync-achievements-from-steam`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao sincronizar conquistas.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao sincronizar conquistas.", error);
        }
    }

    const syncAchievementsBySteamId = async (steamId: string) => {
        try {
            const response = await fetch (`${host}/steam-api/sync-achievements-from-steam/:${steamId}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro ao sincronizar conquistas do jogo.", data.error);
                return null;
            }

            return data;

        } catch (error) {
            console.error("Erro ao sincronizar conquistas do jogo.", error);
        }
    }

    return {
        handleStartGame,
        getGameById,
        fetchGames,
        updateStatus,
        updateHidden,
        updateBeatable,
        updateRTimeLastPlayed,
        syncSteam,
        syncPlaytime,
        syncRtimeLastPlayed,
        getAchievements,
        getAchievementsProgress,
        syncAchievements,
        syncAchievementsBySteamId
    };
}
