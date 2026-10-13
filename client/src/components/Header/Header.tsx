import React, { useState, useEffect } from 'react';
import './styles.css';
import logo from '../../assets/logo.svg';
import JoystickSetup from '../JoystickSetup/JoystickSetup';
import { useDb } from '../../hooks/useDb';
import sync from '../../assets/icons/sync.svg';
import { useShutdown } from '../../hooks/useShutdown';
import { useSound } from '../../hooks/useSound';
import { useLocation, useNavigate } from 'react-router-dom';

import home from '../../assets/icons/home.svg';
import gamepad from '../../assets/icons/gamepad.svg';
import folder from '../../assets/icons/folder.svg';
import achievement from '../../assets/icons/achievement.svg';
import homeSelected from '../../assets/icons/home-selected.svg';
import gamepadSelected from '../../assets/icons/gamepad-selected.svg';
import folderSelected from '../../assets/icons/folder-selected.svg';
import achievementSelected from '../../assets/icons/achievement-selected.svg';


interface MenuItems {
    label: string,
    action: () => void
}

interface TopMenuItems {
    url: string;
    name: string;
    icon: string;
    iconSelected: string;
    label: string;
    alt: string;
}

const Header: React.FC = () => {
    const navigation = useNavigate();
    const location = useLocation();
    const { syncSteam, syncAchievements } = useDb();
    const { shutdown, loading, error } = useShutdown();
    const { playCursorSound, playConfirmSound, playBackSound, playSwipeSound } = useSound();
    const [time, setTime] = useState(new Date());
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isSynchronizing, setIsSynchronizing] = useState(false);
    const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    const formattedTime = time.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    
    const handleSyncSteam = async () => {
        setIsHeaderMenuOpen(false);
        if (!isSynchronizing) {
            setIsSynchronizing(true);
            const result = await syncSteam();
    
            if (result) {
                setIsSynchronizing(false);
                window.location.reload();
            }
        }
    }

    const handleSyncAchievements = async () => {
        setIsHeaderMenuOpen(false);
        if (!isSynchronizing) {
            setIsSynchronizing(true);
            const result = await syncAchievements();
    
            if (result) {
                setIsSynchronizing(false);
                window.location.reload();
            }
        }
    }

    const handleClick = () => {
        setIsHeaderMenuOpen(false);
        shutdown();
    };

    const menuItems: MenuItems[] = [
        { label: 'Inicio', action: () => { setIsHeaderMenuOpen(false); navigation('/'); }},
        { label: 'Backlog', action: () => { setIsHeaderMenuOpen(false); navigation('/backlog'); }},
        { label: 'Voltar', action: () => setIsHeaderMenuOpen(false) },
        { label: 'Sincronizar steam', action: () => handleSyncSteam() },
        { label: 'Sincronizar conquistas', action: () => handleSyncAchievements() },
        { label: 'Sair', action: () => handleClick() }
    ]

    const topMenuItems: TopMenuItems[] = [
        {
            url: '/home',
            name: 'home',
            icon: home,
            iconSelected: homeSelected,
            label: 'Inicio',
            alt: 'casa'
        },
        {
            url: '/library',
            name: 'library',
            icon: gamepad,
            iconSelected: gamepadSelected,
            label: 'Biblioteca',
            alt: 'joystick'
        },
        {
            url: '/collections',
            name: 'collections',
            icon: folder,
            iconSelected: folderSelected,
            label: 'Coleções',
            alt: 'pasta'
        },
        {
            url: '/achievements',
            name: 'achievements',
            icon: achievement,
            iconSelected: achievementSelected,
            label: 'Conquistas',
            alt: 'trofeu'
        }
    ];

     const selected = topMenuItems.find(item =>
        item.url === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.url)
    )?.name ?? '';

    const joystickNavigation = (command: string) => {
        if (command === 'START') {
            setSelectedMenuIndex(0);
            setIsHeaderMenuOpen(!isHeaderMenuOpen);
        }
        if (isHeaderMenuOpen) {
            if (command === 'B') {
                playBackSound();
                setIsHeaderMenuOpen(false);
            } else if (command === 'A') {
                if (selectedMenuIndex === 2) {
                    playBackSound();
                } else {
                    playConfirmSound();
                }
                menuItems[selectedMenuIndex].action();
            } else if (command === 'cima') {
                if (selectedMenuIndex > 0) {
                    playCursorSound();
                    setSelectedMenuIndex(selectedMenuIndex - 1);
                }
            } else if (command === 'baixo') {
                if (selectedMenuIndex < menuItems.length -1) {
                    playCursorSound();
                    setSelectedMenuIndex(selectedMenuIndex + 1);
                }
            }
        }

        const currentPageIndex = topMenuItems.findIndex(item => item.name === selected);
    
        if (command === 'LB' && currentPageIndex !== 0) {
            playSwipeSound();
            navigation(topMenuItems[currentPageIndex - 1].url);
        }
        if (command === 'RB' && currentPageIndex !== topMenuItems.length - 1) {
            playSwipeSound();
            navigation(topMenuItems[currentPageIndex + 1].url);
        }
    };

    return (
        <>
            <JoystickSetup command={joystickNavigation} />
            <div className="header">
                <div className="logo-container">
                    {/* <img onClick={() => setIsHeaderMenuOpen(true)} className="logo" src={logo} alt="game backlog manager logo" /> */}
                    {isSynchronizing && (
                        <div
                            className="sync-steam-btn-container"
                        >
                            <img 
                                className="img-sync-steam-animation"
                                src={sync}
                                alt="sincronizar"
                            />
                            <div className="sync-steam-btn">
                                Sincronizando...
                            </div>
                        </div>
                    )}
                    {loading && (<h2>Saindo...</h2>)}
                </div>
                <div className="pages-section">
                    <ul className="top-menu-list">
                        {topMenuItems.map(item => (
                            <li key={item.name} onClick={() => navigation(item.url)} className={selected === item.name ? 'selected' : ''}>
                                <img src={selected == item.name ? item.iconSelected : item.icon} alt={item.alt} />
                                <p>{item.label}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="clock">{formattedTime}</p>
            </div>

            {isHeaderMenuOpen && (
                <div className="header-menu-container">
                    <img className="logo" src={logo} alt="game backlog manager logo" />
                    <ul>
                        {menuItems.map((item, index) => {
                            if (index >= menuItems.length - 3) { return (
                                <>
                                    <hr />
                                    <li
                                        className={selectedMenuIndex === index ? "selected-header-menu-item header-menu-item" : "header-menu-item" }
                                        onClick={item.action}
                                    >{item.label}</li>
                                </>
                            )} else { return (
                                <li
                                    className={selectedMenuIndex === index ? "selected-header-menu-item header-menu-item" : "header-menu-item" }
                                    onClick={item.action}
                                >{item.label}</li>
                            )}
                        })}
                    </ul>
                </div>
            )}
        </>
    )
}

export default Header;
