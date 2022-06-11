// TL;DR essentially this game is the management of 2 arrays (sequence, input)
// the computer generates an array of [0's, 1's] called sequence
// the user is flashed this sequence and from memory has to input the indices of the 1's
// user input is collected into an array called input
// I use the following values for the arrays/terminology: 0 is unflipped, 1 is flipped, 2 is incorrect answer, 3 is revealed answer
// the level translates into 1) how big the array is and 2) how many 1's or things the user has to remember
// challenge your memory

import React from "react";
import classNames from 'classnames/bind'
import styles from './tower-block.css';

let cx = classNames.bind(styles);

class Game extends React.Component {
	constructor(props) {
	  super(props);    
	  // any level less than 4 is a bit too easy
	  const minLevel = this.props.minLevel || 4;    
	  this.state = {
		topLevel: minLevel,
		currentLevel: minLevel,
		minLevel: minLevel,
		// why have display levels and levels? I don't want the levels to render right away on a setState call
		levelDisplay: [minLevel, minLevel], 
		hotdog: true,
		tile: false,
		sequence: [],
		input: [],
		countdown: null,      
		prompt: 'PLAY',
		hidePrompt: false,            
		message: 'NICE!',
		hideMessage: true,      
		clickable: false,
		interactive: true
	  }
	}
	
	toggleHotdog = () => {
	  this.setState(prevState => ({
		hotdog: !prevState.hotdog
	  }));
	}
  
	toggleTile = () => {
	  this.setState(prevState => ({
		tile: !prevState.tile
	  }));
	}
  
	incrementLevel = () => {
	  this.setState(prevState => ({
		currentLevel: ++prevState.currentLevel,
		topLevel: Math.max(prevState.currentLevel, prevState.topLevel)
	  }));
	}
  
	decrementLevel = () => {
	  if(this.state.currentLevel > this.state.minLevel) {
		this.setState(prevState => ({
		  currentLevel: --prevState.currentLevel
		}));
	  }    
	}
  
	// using the current level, returns a fraction: unflipped / flipped
	difficulty = () => {
	  // I like the ratio of the triangular sequence so I'm gonna use it. 
	  // ([√2n]+1)² triagular sequence, shifted by one and squared to get a box
	  let denominator = Math.pow(Math.round(Math.sqrt(2*this.state.currentLevel)) + 1, 2);
	  let numerator = this.state.currentLevel;
	  return [numerator, denominator];
	}
	
	// generates and randomizes an array of [0's, 1's] based off of game difficulty (function above)
	generateSequence = () => {    
	  let [numerator, denominator] = this.difficulty();
	  let sequence = Array(denominator).fill(0); // the answers represented by [0's, 1's]
	  let input = Array(denominator).fill(0); // user input, init to all 0's
	  let indices = [...Array(denominator).keys()];
	  
	  // the randomIndex could be 4,4,4,4
	  // but the value at indices[randomIndex] will always be different
	  // knuth shuffle
	  for (var i = 0; i < numerator; i++) {
		let max = indices.length - i;
		let randomIndex = Math.floor(Math.random() * max); // 0 to max exclusive    
		sequence[indices[randomIndex]] = 1;
  
		let temp = indices[max - 1];
		indices[max - 1] = indices[randomIndex];
		indices[randomIndex] = temp;    
	  }
	
	  this.setState({sequence, input});
	}
	
	clearInput = () => {
	  let input = this.state.input.slice().fill(0);
	  this.setState({ input });
	}
	
	// the dimensions, like you would specifiy when declaring a 2d array
	// min value 4   
	calcWidth = () => {
	  return Math.max(Math.sqrt(this.state.input.length), 4);
	}
	
	checkGame = (input) => {
	  // because input and sequence are a series of 0's and 1's
	  // converting to binary is an easy way to check for equality
	  // there is a flaw in that input may have 2's and 3's (incorrect answers)
	  // but because 2's or 3's immediately exit the game, this function isn't reached
	  // will improve, at the very least all user input can be transformed to 1's
	  let inputSum = parseInt(input.join(''), 2);
	  let sequenceSum = parseInt(this.state.sequence.join(''), 2);
	  return inputSum === sequenceSum;
	}
	  
	// generarates the sequence, fires off a bunch of animations
	play = () => {    
	  this.generateSequence();
	  // hide the play button, and trigger the 3-2-1 coutdown, flash the answers on the screen
	  this.setState({countdown: 3, hidePrompt: true, interactive: true, levelDisplay:[this.state.currentLevel, this.state.topLevel]});
	  setTimeout(() => { this.setState({countdown: 2}); }, 1000);
	  setTimeout(() => { this.setState({countdown: 1}); }, 2000);
	  setTimeout(() => { 
		let sequence = this.state.sequence.slice();
		this.setState({input: sequence, countdown: null}); 
	  }, 3000);
	 
	  setTimeout(() => { 
		this.clearInput();
		this.setState({clickable: true});
	  }, 5000);
	}
	
	// essentially merge the 2 arrays: input and sequence, anything the user did not mark as an answer equals 3
	reveal = (input) => {
	  for(var i = 0; i < input.length; i++) {
		if(this.state.sequence[i] === 1 && input[i] === 0) {
		  input[i] = 3;
		}
	  }
	  return input;
	}
	
	// given an index is it a correct answer?
	isValid = (index) => {    
	  let input = this.state.input.slice();   
	  if(this.state.sequence[index] === 1) {      
		// right!
		input[index] = 1;
		this.setState({input});
			  
		if(this.checkGame(input)) {
		  this.incrementLevel();
		  this.reset({won: true}); // game is won
		}    
	  } else {                  
		// wrong!
		input[index] = 2;  
		this.setState({input});
		this.decrementLevel();
		setTimeout(() => { this.setState({input: this.reveal(input)}); }, 500);
		this.reset({won: false});
	  }
	}
	 
	// manages the end game animation sequence, all visual, nothing logical   
	reset = (result) => {
	  let {won} = result;    
	  let delay = 0;
	  let message = 'NICE!';
	  if(!won) {
		delay = 500;
		message = 'TRY AGAIN';
	  }
	  
	  this.setState({clickable: false});
	  setTimeout(() => { this.setState({message: message, hideMessage: false}); }, delay+1000);
	  setTimeout(() => { this.clearInput(); }, delay+1500);
	  setTimeout(() => { this.setState({hideMessage: true}); }, delay+2000);
	  setTimeout(() => { this.setState({interactive: false, prompt: 'CONTINUE?', hidePrompt: false}); }, delay+2500);
	}
	
	render() {   
	  const {message, hideMessage, prompt, hidePrompt, 
			 clickable, interactive, countdown, tile, 
			 hotdog, levelDisplay: [currentLevel, topLevel]} = this.state;
	  
	  let buttonClasses = 'button preserve-3d centered';
	  
	  return(
		<div className='game'>
		  <div className='header'>
			<h2>HOTDOG MEMORY GAME</h2>
			<p>Flip the same series of squares shown to you at the start of the level.</p>
		  </div>
		  <div className='wrapper'>
			<div>
			  <div className='info'>
				<div>
				  <label className='margin-right'>
					<input type='checkbox' name='hotdog' 
					  checked={hotdog} onChange={this.toggleHotdog}/>
					Hotdog
				  </label>
				  <label>
					<input type='checkbox' name='tile' 
					  checked={tile} onChange={this.toggleTile}/>
					Tile
				  </label>
				</div>
				<div className='levels'>
				  <span className='margin-right'>LEVEL {currentLevel}</span>
				  <span>BEST {topLevel}</span>
				</div>
  </div>          
			  {/*message and prompt are 2 sides of a cube, need both*/}           
			  <button className={cx(buttonClasses, 'transition-3d', {'centered-faceup':hideMessage})}>{message}</button>
			  <button className={cx(buttonClasses, {'centered-facedown': hidePrompt, 'transition-3d': !hidePrompt})}
				onClick={this.play}>{prompt}</button>
  
			  {countdown ? <div className='countdown centered'>{countdown}</div> : null}
  
			  <Board width={this.calcWidth()} cellWidth={9.5} 
				hotdog={this.state.hotdog} tile={this.state.tile}
				clickable={clickable} onClick={this.isValid}              
				interactive={interactive}
				cells={this.state.input}/>
			</div>
		  </div>        
		</div>
	  );
	}
  }
  
  // I should abstract out Cell, this function is pretty small already
  function Board(props) {
	const {interactive, clickable, tile, hotdog, width, cellWidth, onClick} = props;
	let {cells} = props;
	let styles = {
	  width: cellWidth+'em',
	  height:cellWidth+'em',
	  cursor: onClick ? 'cursor':'inherit'
	};
	  
	// default display    
	if(!cells || cells.length === 0) {
	  cells = Array(16).fill(0);
	}
	cells = cells.map((value, index) => {
	  return(<div className={cx('cell preserve-3d transition-3d', {clickable, hotdog, padded: !tile, flipped: value > 0, wrong: value === 2, missed: value === 3})} 
				  onClick={ clickable ? () => onClick(index):null }
				  key={index} style={{...styles}}/>);
	  });
	return(
  <div className={cx('board', {faded: !interactive})} 
				  style={{width: (width*cellWidth)+'em'}}>{cells}</div>
	);
  }
  

export default Game;
