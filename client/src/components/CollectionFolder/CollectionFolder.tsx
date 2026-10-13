import React from 'react';
import './styles.css';
import { getGameCover } from '../../utils/getGameCover';

export type GameStatus = 'completed' | 'not-played' | 'played';

export interface Game {
    id: string;
    title: string;
    steam_id: string;
    cover_square: string;
    developer: string;
    release_date: string;
    beatable: boolean;
    personal_rating: number;
    playtime: number;
    status: GameStatus;
}

export interface Collection {
    id: string;
    title: string;
    games: Game[];
}

interface ColelctionFolderProps {
    collection: Collection;
    isFocused: boolean;
}

const CollectionFolder: React.FC<ColelctionFolderProps> = ({ collection, isFocused }) => {
    return (
        <>  
            <div className="collection-folder-container">
                <div
                    className={isFocused ? "collection-folder focused" : "collection-folder"}
                >
                    {collection.games.slice(0, 4).map(game => (
                        <div key={game.id} className="game">
                            <img
                                className="collection-game-img"
                                src={getGameCover(game.title, 'square', 'jpg')}
                            />
                        </div> 
                    ))}
                </div>
                <p>{collection.title}</p>
            </div>
        </>
    )
}

export default CollectionFolder;