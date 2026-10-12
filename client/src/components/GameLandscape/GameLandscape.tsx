import React from 'react';
import './styles.css';
import play from '../../assets/icons/play.svg';
import install from '../../assets/icons/install.svg';
import { useRunningGame } from '../../context/RunningGameContext';

interface GameLandscapeProps {
    id: string;
    steamId: string;
    img: string;
    name: string;
    isFocused: boolean;
    isInstalled: boolean;
}

const GameLandscape: React.FC<GameLandscapeProps> = ({ steamId, img, name, isFocused, isInstalled }) => {
    const runningSteamId = useRunningGame();
    const isPlaying = runningSteamId === Number(steamId);

    return (
        <div className="game-landscape">
            <img className="game-landscape-img" src={img} alt={name} />
            {isInstalled ? (
                <div className={isFocused ? "focused play-btn-landscape btn-landscape" : "play-btn-landscape btn-landscape"}>
                    <img className="landscape-btn-icon" src={play} alt="play" />
                    <p>{isPlaying ? "Rodando..." : "Jogar"}</p>
                </div>
            ) : (
                <div className={isFocused ? "focused install-btn-landscape btn-landscape" : "install-btn-landscape btn-landscape"}>
                    <img className="landscape-btn-icon" src={install} alt="instalar" />
                    <p>Instalar</p>
                </div>
            )}
        </div>
    );
};

export default GameLandscape;