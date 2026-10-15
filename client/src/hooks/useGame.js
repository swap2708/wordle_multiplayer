import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket.js';

const STORAGE_KEY_PLAYER_ID = 'wordle_player_id';
const STORAGE_KEY_PLAYER_NAME = 'wordle_player_name';

export function useGame() {
  const [gameState, setGameState] = useState('home'); // 'home' | 'lobby' | 'game' | 'round_results' | 'game_over'
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(() => sessionStorage.getItem(STORAGE_KEY_PLAYER_ID) || '');
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem(STORAGE_KEY_PLAYER_NAME) || '');

  // Active round state
  const [currentGuess, setCurrentGuess] = useState('');
  const [wordSetterWord, setWordSetterWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [usedLetters, setUsedLetters] = useState({});
  const [isWordSet, setIsWordSet] = useState(false);
  const [wordSetter, setWordSetter] = useState(null);
  const [isSetterPromptOpen, setIsSetterPromptOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [toast, setToast] = useState(null);

  // Results
  const [roundResults, setRoundResults] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  // Toast timer ref
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  // Update used letters map
  const updateUsedLetters = useCallback((newGuesses) => {
    const letters = {};
    for (const g of newGuesses) {
      if (!g || !Array.isArray(g.feedback)) continue;
      for (const tile of g.feedback) {
        const l = tile.letter.toLowerCase();
        const currentStatus = letters[l];
        if (tile.status === 'correct') {
          letters[l] = 'correct';
        } else if (tile.status === 'present' && currentStatus !== 'correct') {
          letters[l] = 'present';
        } else if (tile.status === 'absent' && !currentStatus) {
          letters[l] = 'absent';
        }
      }
    }
    setUsedLetters(letters);
  }, []);

  // Socket event listeners
  useEffect(() => {
    function onRoomCreated(data) {
      sessionStorage.setItem(STORAGE_KEY_PLAYER_ID, data.playerId);
      setPlayerId(data.playerId);
      setRoom(data.room);
      setGameState('lobby');
      showToast(`Room created! Code: ${data.roomCode}`, 'success');
    }

    function onRoomJoined(data) {
      sessionStorage.setItem(STORAGE_KEY_PLAYER_ID, data.playerId);
      setPlayerId(data.playerId);
      setRoom(data.room);

      if (data.room.status === 'playing') {
        setGameState('game');
        setIsWordSet(data.room.wordIsSet);
        setWordSetter(data.room.wordSetter);
        if (data.room.myGuessState && data.room.myGuessState.guesses) {
          setGuesses(data.room.myGuessState.guesses);
          updateUsedLetters(data.room.myGuessState.guesses);
        }
      } else if (data.room.status === 'finished') {
        setGameState('game_over');
      } else {
        setGameState('lobby');
      }

      showToast(data.reconnected ? 'Reconnected to room' : 'Joined room', 'success');
    }

    function onPlayerJoined(data) {
      setRoom(data.room);
      showToast(`${data.player.name} joined the room`, 'info');
    }

    function onPlayerLeft(data) {
      if (data.room) setRoom(data.room);
      showToast(`${data.playerName} left the room`, 'info');
    }

    function onPlayerReconnected(data) {
      showToast(`${data.playerName} reconnected`, 'info');
    }

    function onGameStarted(data) {
      setGameState('game');
      setIsWordSet(false);
      setWordSetter(data.wordSetter);
      setGuesses([]);
      setCurrentGuess('');
      setWordSetterWord('');
      setUsedLetters({});
      setRoundResults(null);
      setGameOverData(null);
      showToast(`Game started! Round ${data.round} of ${data.totalRounds}`, 'info');
    }

    function onSetWordPrompt(data) {
      setIsSetterPromptOpen(true);
      showToast(data.message, 'info');
    }

    function onWordSet(data) {
      setIsWordSet(true);
      setIsSetterPromptOpen(false);
      showToast(`${data.wordSetterName} has chosen the secret word! Start guessing!`, 'success');
    }

    function onGuessResult(data) {
      setGuesses(prev => {
        const next = [...prev, { word: data.word, feedback: data.feedback }];
        updateUsedLetters(next);
        return next;
      });
      setCurrentGuess('');

      if (data.solved) {
        showToast('Splendid! You guessed the word correctly!', 'success');
      } else if (data.attempts >= 5) {
        showToast('All attempts used for this round!', 'info');
      }
    }

    function onRoundEnd(data) {
      setRoundResults(data);
      setGameState('round_results');
      if (data.winnerName) {
        showToast(`Round over! ${data.winnerName} won this round!`, 'success');
      } else {
        showToast(`Round over! Nobody guessed "${data.secretWord.toUpperCase()}".`, 'info');
      }
    }

    function onNextRoundStarted(data) {
      setGameState('game');
      setIsWordSet(false);
      setWordSetter(data.wordSetter);
      setGuesses([]);
      setCurrentGuess('');
      setWordSetterWord('');
      setUsedLetters({});
      setRoundResults(null);
      showToast(
        data.skipped
          ? `Round skipped! Starting Round ${data.round} of ${data.totalRounds}`
          : `Starting Round ${data.round} of ${data.totalRounds}`,
        'info'
      );
    }

    function onGameOver(data) {
      setGameOverData(data);
      setGameState('game_over');
      showToast(data.winner ? `Game Over! 🏆 ${data.winner.name} wins!` : 'Game Over!', 'success');
    }

    function onError(data) {
      showToast(data.message || 'An error occurred', 'error');
      triggerShake();
    }

    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('player_reconnected', onPlayerReconnected);
    socket.on('game_started', onGameStarted);
    socket.on('set_word_prompt', onSetWordPrompt);
    socket.on('word_set', onWordSet);
    socket.on('guess_result', onGuessResult);
    socket.on('round_end', onRoundEnd);
    socket.on('next_round_started', onNextRoundStarted);
    socket.on('game_over', onGameOver);
    socket.on('error', onError);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('player_reconnected', onPlayerReconnected);
      socket.off('game_started', onGameStarted);
      socket.off('set_word_prompt', onSetWordPrompt);
      socket.off('word_set', onWordSet);
      socket.off('guess_result', onGuessResult);
      socket.off('round_end', onRoundEnd);
      socket.off('next_round_started', onNextRoundStarted);
      socket.off('game_over', onGameOver);
      socket.off('error', onError);
    };
  }, [showToast, triggerShake, updateUsedLetters]);

  // Actions
  const createRoom = useCallback((name) => {
    if (!name || !name.trim()) {
      showToast('Please enter your display name', 'error');
      return;
    }
    const clean = name.trim();
    sessionStorage.setItem(STORAGE_KEY_PLAYER_NAME, clean);
    setPlayerName(clean);
    if (!socket.connected) socket.connect();
    socket.emit('create_room', { playerName: clean });
  }, [showToast]);

  const joinRoom = useCallback((code, name) => {
    if (!code || !code.trim()) {
      showToast('Please enter a room code', 'error');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    const cleanName = (name || playerName || '').trim();
    if (!cleanName) {
      showToast('Please enter your display name', 'error');
      return;
    }
    sessionStorage.setItem(STORAGE_KEY_PLAYER_NAME, cleanName);
    setPlayerName(cleanName);
    if (!socket.connected) socket.connect();
    socket.emit('join_room', {
      roomCode: cleanCode,
      playerName: cleanName,
      playerId: playerId || sessionStorage.getItem(STORAGE_KEY_PLAYER_ID)
    });
  }, [playerName, playerId, showToast]);

  const startGame = useCallback(() => {
    if (!room) return;
    socket.emit('start_game', { roomCode: room.code });
  }, [room]);

  const submitWord = useCallback((word) => {
    if (!room) return;
    const target = (word || wordSetterWord).trim().toLowerCase();
    if (target.length !== 5) {
      showToast('Word must be exactly 5 letters', 'error');
      triggerShake();
      return;
    }
    socket.emit('submit_word', { roomCode: room.code, word: target });
  }, [room, wordSetterWord, showToast, triggerShake]);

  const submitGuess = useCallback((wordToSubmit) => {
    if (!room) return;
    const guess = (wordToSubmit || currentGuess).trim().toLowerCase();
    if (guess.length !== 5) {
      showToast('Guess must be exactly 5 letters', 'error');
      triggerShake();
      return;
    }
    socket.emit('submit_guess', { roomCode: room.code, word: guess });
  }, [room, currentGuess, showToast, triggerShake]);

  const requestNextRound = useCallback(() => {
    if (!room) return;
    socket.emit('request_next_round', { roomCode: room.code });
  }, [room]);

  const requestSkipRound = useCallback(() => {
    if (!room) return;
    socket.emit('request_skip_round', { roomCode: room.code });
  }, [room]);

  const isHost = Boolean(room && playerId && room.hostId === playerId);
  const isWordSetter = Boolean(wordSetter && playerId && wordSetter.id === playerId);

  // Keyboard handler for typing
  const handleKey = useCallback((key) => {
    if (gameState !== 'game') return;

    if (isWordSetter && !isWordSet) {
      // Word setter typing word
      if (key === 'ENTER') {
        submitWord(wordSetterWord);
      } else if (key === 'BACKSPACE') {
        setWordSetterWord(prev => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        if (wordSetterWord.length < 5) {
          setWordSetterWord(prev => prev + key.toUpperCase());
        }
      }
      return;
    }

    if (!isWordSetter && isWordSet) {
      // Guesser typing
      if (guesses.length >= 5) return; // All attempts used
      const lastGuess = guesses[guesses.length - 1];
      if (lastGuess && lastGuess.feedback && lastGuess.feedback.every(f => f.status === 'correct')) {
        return; // Already solved
      }

      if (key === 'ENTER') {
        if (currentGuess.length === 5) {
          submitGuess(currentGuess);
        } else {
          showToast('Not enough letters (must be 5)', 'error');
          triggerShake();
        }
      } else if (key === 'BACKSPACE') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        if (currentGuess.length < 5) {
          setCurrentGuess(prev => prev + key.toLowerCase());
        }
      }
    }
  }, [gameState, isWordSetter, isWordSet, wordSetterWord, guesses, currentGuess, submitWord, submitGuess, showToast, triggerShake]);

  const playAgain = useCallback(() => {
    setGameState('lobby');
    setGuesses([]);
    setCurrentGuess('');
    setWordSetterWord('');
    setUsedLetters({});
    setRoundResults(null);
    setGameOverData(null);
  }, []);

  const leaveRoom = useCallback(() => {
    socket.disconnect();
    setRoom(null);
    setGameState('home');
    setGuesses([]);
    setCurrentGuess('');
    setWordSetterWord('');
    setUsedLetters({});
    setRoundResults(null);
    setGameOverData(null);
  }, []);

  return {
    gameState,
    room,
    playerId,
    playerName,
    isHost,
    isWordSetter,
    wordSetter,
    isWordSet,
    currentGuess,
    setCurrentGuess,
    wordSetterWord,
    setWordSetterWord,
    guesses,
    usedLetters,
    isShaking,
    toast,
    roundResults,
    gameOverData,
    isSetterPromptOpen,
    createRoom,
    joinRoom,
    startGame,
    submitWord,
    submitGuess,
    requestNextRound,
    requestSkipRound,
    handleKey,
    playAgain,
    leaveRoom,
    showToast,
    closeToast: () => setToast(null)
  };
}
