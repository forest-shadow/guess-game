import {forwardRef, useImperativeHandle} from 'react';
import {useTimer} from "../hooks/useTimer";

export const formatTime = (timer: number) => {
  const getSeconds = `0${(timer % 60)}`.slice(-2)
  const minutes = `${Math.floor(Number(timer) / 60)}`
  const getMinutes = `0${Number(minutes) % 60}`.slice(-2)
  const getHours = `0${Math.floor(timer / 3600)}`.slice(-2)

  return `${getHours} : ${getMinutes} : ${getSeconds}`
}

interface StopwatchProps {
  initialTimer?: number
}
export const Stopwatch = forwardRef(({initialTimer = 0}: StopwatchProps, ref) => {
  const {
    timer,
    handleStart,
    handlePause,
    handleReset,
  } = useTimer(initialTimer);

  useImperativeHandle(ref, () => {
    return {
      handleStartTimer() {
        handleStart()
      },
      handlePauseTimer() {
        handlePause()
      },
      handleResetTimer() {
        handleReset()
      },
    };
  }, [handleStart, handlePause, handleReset]);

  return (
    <div className="game-display">
      Stopwatch: {formatTime(timer)}
    </div>
  )
})