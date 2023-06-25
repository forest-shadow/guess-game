import {useEffect, useReducer, memo, useRef} from "react";
import {Stopwatch} from "../Stopwatch";
import './GuessGame.css';

const API_URL = 'https://yesno.wtf/api'

const fetchCards = () => Promise.all(
  Array.from(Array(9).keys()).map(() => fetch(API_URL).then((response) => {
    return response.json();
  }))
).then((values) => {
  return Array.from(Array(9).keys())
    .map((el, index) => ({id: index, isChecked: false, isSelected: false, value: values[index].answer}))
})

const getCardBorderColor = (card: ICard) => {
  if (card.isChecked) {
    return card.isGuessed ? 'green' : 'red'
  }
  return card.isSelected ? 'purple' : 'white'
}

enum ACTION_TYPE {
  SET_CARDS = 'SET_CARDS',
  START_GAME = 'START_GAME',
  STOP_GAME = 'STOP_GAME',
  SET_SELECTED_CARD = 'SET_SELECTED_CARD',
  RESET_SELECTED_CARD = 'RESET_SELECTED_CARD',
  SET_CHECKED_CARD = 'SET_CHECKED_CARD',
  INCREMENT_RIGHT_ANSWERS_COUNTER = 'INCREMENT_RIGHT_ANSWERS_COUNTER',
  RESET_GAME_STATE = 'RESET_GAME_STATE'
}

enum GuessCardValue {
  YES = 'yes',
  NO = 'no'
}
interface ICard {
  id: number;
  isChecked: boolean;
  isSelected: boolean;
  isGuessed: boolean;
  value: GuessCardValue | null;
  color: string;
}

enum GameStatus {
  INITIALIZED = 'initialized',
  STARTED = 'started',
  STOPPED = 'stopped'
}
interface IGameState {
  status: GameStatus;
  selectedCard: ICard | null,
  cards: ICard[];
  answersCounter: number;
  rightAnswersCounter: number;
}

const initialGameState: IGameState = {
  status: GameStatus.INITIALIZED,
  selectedCard: null,
  cards: [],
  answersCounter: 0,
  rightAnswersCounter: 0
}

const gameReducer = (state: IGameState, {type, payload}: { type: string; payload?: any }): IGameState => {
  switch (type) {
    case ACTION_TYPE.SET_CARDS:
      return {...state, cards: payload}
    case ACTION_TYPE.START_GAME:
      return {...state, status: GameStatus.STARTED};
    case ACTION_TYPE.STOP_GAME:
      return {...state, status: GameStatus.STOPPED};
    case ACTION_TYPE.SET_SELECTED_CARD:
      return {
        ...state,
        selectedCard: payload,
        cards: state.cards.map(card => card.id === payload.id ? ({...card, isSelected: true}) : ({
          ...card,
          isSelected: false
        }))
      }
    case ACTION_TYPE.RESET_SELECTED_CARD:
      return {
        ...state,
        selectedCard: null
      }
    case ACTION_TYPE.SET_CHECKED_CARD:
      return {
        ...state,
        cards: state.cards.map(card => card.id === payload.id ? ({...payload, isChecked: true, isSelected: false}) : card),
        answersCounter: state.answersCounter + 1
      }
    case ACTION_TYPE.INCREMENT_RIGHT_ANSWERS_COUNTER:
      return {
        ...state,
        rightAnswersCounter: state.rightAnswersCounter + 1
      }
    case ACTION_TYPE.RESET_GAME_STATE:
      return {
        ...initialGameState
      }
    default:
      return initialGameState;
  }
}

interface IStopwatchHandlers {
  handleResetTimer: () => void
  handleStartTimer: () => void
  handlePauseTimer: () => void
}

export const GuessGame = memo(() => {
  const stopwatchRef = useRef<IStopwatchHandlers>(null);

  const [gameState, dispatch] = useReducer(gameReducer, initialGameState)
  const onStartGame = () => {
    if (gameState.status === GameStatus.STOPPED) {
      fetchCards().then(cards => {
        stopwatchRef.current?.handleResetTimer()
        dispatch({type: ACTION_TYPE.RESET_GAME_STATE})
        dispatch({type: ACTION_TYPE.START_GAME})
        dispatch({type: ACTION_TYPE.SET_CARDS, payload: cards})
        stopwatchRef.current?.handleStartTimer()
      })
    } else {
      dispatch({type: ACTION_TYPE.START_GAME})
      stopwatchRef.current?.handleStartTimer()
    }
  }
  const onStopGame = () => {
    dispatch({type: ACTION_TYPE.STOP_GAME})
    stopwatchRef.current?.handlePauseTimer()
  }
  const onCardSelect = (card: ICard) => {
    if (gameState.status === GameStatus.STARTED && !card.isChecked)
      dispatch({type: ACTION_TYPE.SET_SELECTED_CARD, payload: card})
  }
  const onGuessHandle = (value: GuessCardValue) => {
    if(gameState.selectedCard && !gameState.selectedCard.isChecked) {
      if(gameState.selectedCard.value === value) {
        dispatch({type: ACTION_TYPE.SET_CHECKED_CARD, payload: { ...gameState.selectedCard, isGuessed: true }})
        dispatch({type: ACTION_TYPE.RESET_SELECTED_CARD})
        dispatch({type: ACTION_TYPE.INCREMENT_RIGHT_ANSWERS_COUNTER})
      } else {
        dispatch({type: ACTION_TYPE.SET_CHECKED_CARD, payload: {...gameState.selectedCard}})
      }
    }
  }
  const onYesGuessHandle = () => {
    if(gameState.status === GameStatus.STARTED)
      onGuessHandle(GuessCardValue.YES)
  }
  const onNoGuessHandle = () => {
    if(gameState.status === GameStatus.STARTED)
      onGuessHandle(GuessCardValue.NO)
  }

  useEffect(() => {
    if(!!gameState.cards.length && gameState.answersCounter === gameState.cards.length) {
      onStopGame()
    }
  }, [gameState.answersCounter, gameState.cards.length])

  useEffect(() => {
    fetchCards().then(cards => {
      dispatch({type: ACTION_TYPE.SET_CARDS, payload: cards})
    })
  }, [])

  return (
    <div className="guess-game">
      <div className="guess-game__watch">
        <Stopwatch ref={stopwatchRef}/>
      </div>
      <div className="guess-game__start-controls">
        {gameState.status === GameStatus.STARTED ? (
          <button onClick={onStopGame}>Stop</button>
        ) : (
          <button onClick={onStartGame}>Start</button>
        )}
      </div>
      <div className="guess-game__guess-controls">
        <button onClick={onYesGuessHandle}>Yes</button>
        <button onClick={onNoGuessHandle}>No</button>
      </div>
      <div className="guess-game__game-tiles">
        <div className="game-tiles-wrapper">
          {gameState.cards.map(card => (
            <div
              key={card.id}
              className="game-tile"
              style={{borderColor: getCardBorderColor(card)}}
              onClick={() => {
                onCardSelect(card)
              }}
            >{card.value}</div>
          ))}
        </div>
      </div>
      <div className="guess-game__game-display">
        <div className="game-display">
          Correct: {gameState.rightAnswersCounter}
        </div>
      </div>
    </div>
  )
})
