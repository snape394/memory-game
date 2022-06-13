import React from 'react';
import './App.css';
import Game from "./components/tower-block/tower-block.component"
import Minesweeper from './components/minesweeper/mine.component';

function App() {
  return (
    <div className="App">
      <Minesweeper/>
    </div>
  );
}

export default App;
