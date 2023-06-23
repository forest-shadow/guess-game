import './GuessGame.css';
import {formatTime, useTimer} from "../hooks/useTimer";
import {useReducer} from "react";

interface ICard {
  id: number;
  isChecked: boolean;
  isSelected: boolean;
  value: 'yes' | 'no' | null
}

enum GameStatus {
  INITIALIZED = 'initialized',
  STARTED = 'started',
  STOPPED = 'stopped'
}
interface IGameState {
  status: GameStatus
  cards: ICard[];
  answers: number;
}
const initialGameState: IGameState = {
  status: GameStatus.INITIALIZED,
  cards: Array.from(Array(9).keys())
    .map((el, index) => ({ id: index, isChecked: false, isSelected: false, value: null })),
  answers: 0
}

export const GuessGame = () => {
  const {
    timer,
    handleStart: handleStartTimer,
    handlePause: handlePauseTimer,
    handleReset: handleResetTimer,
  } = useTimer(0);

  const gameReducer = (state: IGameState, {type, payload}: {type: string; payload?: any}): IGameState => {
    switch (type) {
      case 'START_GAME':
        return {...state, status: GameStatus.STARTED, cards: initialGameState.cards};
      case 'STOP_GAME':
        return {...state, status: GameStatus.STOPPED};
      case 'SET_SELECTED_CARD':
        return {
          ...state,
          cards: state.cards.map(card => card.id === payload.id ? ({...card, isSelected: true}): ({...card, isSelected: false}))
        }
      default:
        return initialGameState;
    }
  }

  const [gameState, dispatch] = useReducer(gameReducer, initialGameState)
  const onStartGame = () => {
    dispatch({type: 'START_GAME'})
    if(gameState.status === GameStatus.STOPPED)
      handleResetTimer()
    handleStartTimer()
  }
  const onStopGame = () => {
    dispatch({type: 'STOP_GAME'})
    handlePauseTimer()
  }
  const onCardSelect = (card: ICard) => {
    if(gameState.status === GameStatus.STARTED)
      dispatch({type: 'SET_SELECTED_CARD', payload: card})
  }

  return (
    <div className="guess-game">
      <div className="guess-game__watch">
        <div className="game-display">
          Stopwatch: {formatTime(timer)}
        </div>
      </div>
      <div className="guess-game__start-controls">
        {gameState.status === GameStatus.STARTED ? (
          <button onClick={onStopGame}>Stop</button>
        ) : (
          <button onClick={onStartGame}>Start</button>
        )}

      </div>
      <div className="guess-game__guess-controls">
        <button>Yes</button>
        <button>No</button>
      </div>
      <div className="guess-game__game-tiles">
        <div className="game-tiles-wrapper">
          {gameState.cards.map(card => (
            <div
              key={card.id}
              className="game-tile"
              style={{ borderColor: card.isSelected ? 'purple': 'white' }}
              onClick={() => {
                onCardSelect(card)
              }}
            ></div>
          ))}
        </div>
      </div>
      <div className="guess-game__game-display">
        <div className="game-display">
          Correct: {gameState.answers}
        </div>
      </div>
    </div>
  )
}