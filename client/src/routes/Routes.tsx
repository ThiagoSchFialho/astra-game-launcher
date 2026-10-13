import { Routes, Route, Navigate  } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Library from '../pages/Library/Library';
import Backlog from '../pages/Backlog/Backlog';
import Collections from '../pages/Collections/Collections';
import Collection from '../pages/Collection/Collection';
import Achievements from '../pages/Achievements/Achievements';
import GamePage from '../pages/GamePage/GamePage';


const AppRoutes = () => {
    return (
        <Routes>
            <Route path='/' element={<Navigate to='/home' replace />} />
            <Route path='/home' element={<Home />} />
            <Route path='/home/:id' element={<Home />} />
            <Route path='/game-page/:page/:id' element={<GamePage />} />
            <Route path='/library' element={<Library />} />
            <Route path='/library/:id' element={<Library />} />
            <Route path='/backlog' element={<Backlog />} />
            <Route path='/collections' element={<Collections />} />
            <Route path='/collection/:id' element={<Collection />} />
            <Route path='/achievements' element={<Achievements />} />
            <Route path='/achievements/:id' element={<Achievements />} />
        </Routes>
    )
}

export default AppRoutes;