import React, { useEffect, useState } from 'react';
import './styles.css';
import GameActionsMenu from '../GameActionsMenu/GameActionsMenu';
interface GameCardsPortraitProps {
    id: string;
    steamId: string;
    img: string;
    name: string;
    playtime: number;
    isFocused: boolean;
    isOpen: boolean;
    onCloseMenu: () => void;
}

const GameCardPortrait: React.FC<GameCardsPortraitProps> = ({ id, steamId, img, name, playtime, isFocused, isOpen, onCloseMenu }) => {
    const [isGameActionsMenuOpen, setIsGameActionsMenuOpen] = useState(isOpen);

    useEffect(() => {
        setIsGameActionsMenuOpen(isOpen);
    }, [isOpen]);

    const handleCloseMenu = () => {
        setIsGameActionsMenuOpen(false);
        onCloseMenu?.();
    }
    
    return (
        <>
            <GameActionsMenu
                gameSteamId={steamId}
                gameId={id}
                isOpen={isGameActionsMenuOpen}
                closeMenu={() => handleCloseMenu()}
            />
            <div className={isFocused ? "game-card-portrait game-card-portrait-focused" : "game-card-portrait"}>
                <img
                    className="game-card-portrait-img"
                    src={img}
                    alt={name}
                />
            </div>
        </>
    );
};

export default GameCardPortrait;