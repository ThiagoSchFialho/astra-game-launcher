import React, { useEffect, useState } from "react";
import './styles.css';

import JoystickSetup from "../JoystickSetup/JoystickSetup";
import Keyboard from "../Keyboard/Keyboard";

import { useSound } from "../../hooks/useSound";
import { useCollection } from "../../hooks/useCollection";

interface CollectionActionsMenuProps {
    collectionId: string;
    isOpen: boolean;
    closeMenu: () => void;
    onRename?: (collectionId: string) => void;
    onDelete?: (collectionId: string) => void;
}

interface MenuItem {
    id: number;
    label: string;
    action: () => void;
}

const CollectionActionsMenu: React.FC<CollectionActionsMenuProps> = ({
    collectionId,
    isOpen,
    closeMenu,
    onRename,
    onDelete,
}) => {
    const { playConfirmSound, playConfirm2Sound, playCursorSound, playBackSound, playPopupSound } = useSound();
    const { updateCollectionTitle, deleteCollection } = useCollection();

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isRenameFormOpen, setIsRenameFormOpen] = useState(false);
    const [collectionTitle, setCollectionTitle] = useState<string | undefined>('');

    useEffect(() => {
        setSelectedIndex(0);
        setIsRenameFormOpen(false);
    }, [isOpen]);

    // --- Actions ------------------------------------------------------------
    const openRenameForm = () => {
        setIsRenameFormOpen(true);
    };

    const handleRename = async (phrase: string) => {
        const newTitle = phrase.trim();
        if (!newTitle) return;

        playConfirmSound();
        const result = await updateCollectionTitle(collectionId, newTitle);
        if (!result) return;

        setIsRenameFormOpen(false);
        onRename?.(collectionId);
        closeMenu();
    };

    const handleDelete = async () => {
        const result = await deleteCollection(collectionId);
        if (!result) return;

        onDelete?.(collectionId);
        closeMenu();
    };

    // --- Menu structure -------------------------------------------------
    const menuItems: MenuItem[] = [
        { id: 0, label: 'Renomear', action: () => { playPopupSound(); openRenameForm(); } },
        { id: 1, label: 'Excluir', action: handleDelete },
        { id: 2, label: 'Fechar', action: () => closeMenu() },
    ];

    // --- Joystick navigation -------------------------------------------
    const moveSelection = (current: number, direction: 'cima' | 'baixo', length: number) => {
        const delta = direction === 'baixo' ? 1 : -1;
        return Math.min(Math.max(current + delta, 0), length - 1);
    };

    const navigateMenu = (command: string) => {
        if (command === 'cima' || command === 'baixo') {
            playCursorSound();
            setSelectedIndex(prev => moveSelection(prev, command, menuItems.length));
        } else if (command === 'A') {
            playConfirm2Sound();
            menuItems[selectedIndex]?.action();
        } else if (command === 'B') {
            playBackSound();
            closeMenu();
        }
    };

    const joystickNavigation = (command: string) => {
        if (command === 'START') {
            setIsHeaderMenuOpen(!isHeaderMenuOpen);
        }

        if (isHeaderMenuOpen) {
            if (command === 'B' || command === 'A') {
                setIsHeaderMenuOpen(false);
            }
        }
        if (!isHeaderMenuOpen) {
            navigateMenu(command);
        }
    };

    // --- Render -----------------------------------------------------------
    if (!isOpen) return null;

    return (
        <>
            {!isRenameFormOpen && <JoystickSetup command={joystickNavigation} />}

            <div className="collection-actions-menu-background">
                <div className="collection-actions-menu">
                    <ul>
                        {menuItems.map((item, index) => (
                            <li
                                key={item.id}
                                className={selectedIndex === index ? "collection-actions-menu-focused" : ""}
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {isRenameFormOpen && (
                <>
                    <div className="collection-title-form-container">
                        <div className="collection-title-form-header">
                            <h2>Renomear Coleção</h2>
                        </div>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <label htmlFor="collection-title">Novo nome</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    name="collection-title"
                                    id="collection-title"
                                    maxLength={35}
                                    required
                                    readOnly
                                    value={collectionTitle}
                                />
                            </div>
                        </form>
                    </div>
                    <Keyboard
                        onKeyPressed={setCollectionTitle}
                        onDone={handleRename}
                        onClose={() => setIsRenameFormOpen(false)}
                    />
                </>
            )}
        </>
    );
};

export default CollectionActionsMenu;