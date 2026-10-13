import React, { useState, useEffect } from 'react';
import GameList from '../../components/GameList/GameList';
import { useDb } from '../../hooks/useDb';
import type { Game } from '../../types/gamesType';
import { useParams } from 'react-router-dom';


const Library: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { fetchGames } = useDb();
    const [gamesList, setGamesList] = useState<Game[]>([]);

    const getGames = async () => {
        const games = await fetchGames();
        if (games) {
            setGamesList(games);
        }
    }
    useEffect(() => {
        getGames();
    }, [])

    return (
        <>
            <GameList list={gamesList} selectedGame={id ?? ''} />
        </>
    )
}
export default Library;