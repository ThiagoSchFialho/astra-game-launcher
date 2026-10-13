import React, { useState, useEffect } from 'react';
import { useDb } from '../../hooks/useDb';
import { useSystem } from '../../hooks/useSystem';
import type { Game } from '../../types/gamesType';
import { orderBy } from '../../utils/orderBy';
import HorizontalGameList from '../../components/HorizontalGameList/HorizontalGameList';
import { useParams } from 'react-router-dom';


const Home: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { fetchGames } = useDb();
    const { fetchInstalledGames } = useSystem();
    const [gamesList, setGamesList] = useState<Game[]>([]);

    const getGames = async () => {
        const [games, installedApps] = await Promise.all([
            fetchGames(),
            fetchInstalledGames(),
        ]);

        if (games) {
            const installedIds = new Set(installedApps.map((app) => app.appId));
            const orderedList = orderBy(games, 'rtime_last_played', 'desc');

            setGamesList(
                orderedList.filter(
                    (game: Game) => !game.hidden && installedIds.has(Number(game.steam_id))
                )
            );
        }
    }
    useEffect(() => {
        getGames();
    }, [])

    return (
        <>
            <HorizontalGameList list={gamesList} selectedGame={id ?? ''} />
        </>
    )
}
export default Home;