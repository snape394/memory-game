import React from "react";
import "./mine.css"

const size = 10
let mines = 10

function create2dArray(tiles, defaults = {}) {
  return new Array(tiles)
    .fill(new Array(tiles).fill(0))
    .map(row => row.map(tile => ({...defaults})))
}

function shuffleArray(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]]
  }

  return a
}

let touchTime = null
const Tile = ({onClick, onContextMenu, index, isMine, isOpen, isFlagged, mineCount}) => {
  const classes = ['minesweeper--tile']
  const text = isOpen ? isMine ? '☉' : mineCount ? mineCount : '' : isFlagged ? '⚑' : ''

  isOpen && classes.push('open')
  isFlagged && classes.push('flag')
  isOpen && isMine && classes.push('mine')

  return (
    <div
      onTouchStart={() => touchTime = new Date().getTime()}
      onTouchEnd={(event) => new Date().getTime() - touchTime < 200 ? onClick(index) : onContextMenu(event,index)}
      onClick={() => ! touchTime && onClick(index)}
      onContextMenu={(event) => onContextMenu(event,index)}
      className={classes.join(' ')}
    >
      {text}
    </div>
  )
}

const PlayField = ({fields, onClick, onContextMenu}) => {
  return (
    <div className="minesweeper--playfield">
      {fields.map((row, rowIndex) => (
        <div className="row">
          {row.map(({isMine, isOpen, isFlagged, mineCount}, tileIndex) => (
            <Tile onClick={onClick} onContextMenu={onContextMenu} index={{rowIndex, tileIndex}} isMine={isMine} isOpen={isOpen} isFlagged={isFlagged} mineCount={mineCount} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default class Minesweeper extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      playField: null,
      action: null
    }
  }

  componentDidMount() {
    this.setup(mines)
  }

  setup(level) {
    const playField = create2dArray(size, {
      isMine: false,
      isOpen: false,
      isFlagged: false,
      mineCount: 0
    })
    
    mines = level

    this.setState({
      playField,
      action: null
    }, this.startGame)
  }

  startGame() {
    let playField = [...this.state.playField]
    const options = [].concat(...this.state.playField.map((row, rowIndex) => row.map((tile, tileIndex) => ([rowIndex, tileIndex]))))

    shuffleArray(options).slice(0, mines).map(option => playField[option[0]][option[1]].isMine = true)

    playField = playField.map((row, rowIndex) => {
      return row.map((tile, tileIndex) => {
        if (tile.isMine) return tile

        const neighbourRows = [playField[rowIndex-1], playField[rowIndex], playField[rowIndex+1]].filter(row => row)
        const neighbours = neighbourRows.map((row) => [row[tileIndex-1], row[tileIndex], row[tileIndex+1]].filter(tile => tile)).reduce((prev, curr) => prev.concat(curr))

        tile.mineCount = neighbours.filter((tile) => tile.isMine).length

        return tile
      })
    })

    this.setState({playField})
  }

  onClick(tile) {
    const playField = [...this.state.playField]

    if (playField[tile.rowIndex][tile.tileIndex].isMine) {
      playField.map(row => row.map(tile => {
        tile.isOpen = true
        tile.isFlagged = false

        return tile
      }))

      return this.setState({playField, action: false})
    }


    this.openTile(tile.rowIndex, tile.tileIndex)
  }

  onContextMenu(event, tile) {
    event.preventDefault()

    const playField = [...this.state.playField]

    if (playField[tile.rowIndex][tile.tileIndex].isOpen) return

    playField[tile.rowIndex][tile.tileIndex].isFlagged = true

    this.setState({playField})
  }

  openTile(row, tile) {
    const playField = [...this.state.playField]

    if (playField[row][tile].isOpen) return

    playField[row][tile].isOpen = true
    playField[row][tile].isFlagged = false

    if (playField[row][tile].mineCount === 0) {
      setTimeout(() => this.openSurrounding(row, tile), 50)
    }

    this.setState({playField})

    const leftOverTiles = playField.reduce((sum, row) => sum + row.filter((tile) => ! tile.isOpen).length, 0)

    if (leftOverTiles <= mines) {
      this.setState({action: true})
    }
  }

  openSurrounding(rowIndex, tileIndex) {
    const playField = [...this.state.playField]
    const rows = [rowIndex - 1, rowIndex, rowIndex + 1].filter((index) => index >= 0 && index < size)
    const tiles = [tileIndex - 1, tileIndex, tileIndex + 1].filter((index) => index >= 0 && index < size)

    rows.map((row) => tiles.map((tile) => ! playField[row][tile].isMine?this.openTile(row, tile):''))
  }

  render() {
    const {playField, action} = this.state
    const classes = ['minesweeper']

    if (! playField) return null

    action === true && classes.push('success')
    action === false && classes.push('fail')

    return (
      <div className={classes.join(' ')}>
        <h1>Minesweeper</h1>
        <PlayField fields={playField} onClick={(index) => this.onClick(index)} onContextMenu={(event, index) => this.onContextMenu(event, index)} />
        <h2 className="minesweeper--success">Hooray!!! You did it!</h2>
        <div className="minesweeper--link">
          <button onClick={() => this.setup(mines)}>Restart game</button><br/>
          <button onClick={() => this.setup(10)}>Normal</button><br/>
          <button onClick={() => this.setup(20)}>Hard</button><br/>
          <button onClick={() => this.setup(50)}>Insane</button>
        </div>
      </div>
    )
  }
}


