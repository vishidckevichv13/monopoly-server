import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, ClientAction } from '@monopoly/shared';
import { socket } from './socket/socketClient.js';
import { initTelegramApp, getCurrentUser, triggerHapticNotification } from './telegram/tma.js';
import { HeaderHUD } from './components/HeaderHUD.js';
import { GameBoard } from './components/GameBoard.js';
import { BottomActionSheet } from './components/BottomActionSheet.js';
import { GameLogs } from './components/GameLogs.js';
import { LobbyView } from './components/LobbyView.js';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser] = useState<PlayerState>(() => {
    const u = getCurrentUser();
    return {
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      color: '#3B82F6',
      tokenIndex: 0,
      balance: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      isBot: false,
      doublesRolledCount: 0,
      properties: []
    };
  });

  const [currentRoom, setCurrentRoom] = useState<{
    id: string;
    name: string;
    hostId: string;
    players: PlayerState[];
    isStarted: boolean;
  } | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const prevTurnRef = useRef<number | null>(null);
  const prevActivePlayerRef = useRef<number | null>(null);

  useEffect(() => {
    initTelegramApp();

    socket.on('connect', () => {
      console.log('Connected to game server');
    });

    socket.on('room_created', (data: { roomId: string }) => {
      console.log('Room created:', data.roomId);
    });

    socket.on('room_updated', (data: any) => {
      setCurrentRoom(data);
    });

    socket.on('game_state', (state: GameState) => {
      // Auto-clear inspected tile on new turn or turn phase change so camera tracks the player
      if (
        prevTurnRef.current !== state.turnNumber ||
        prevActivePlayerRef.current !== state.activePlayerIndex
      ) {
        prevTurnRef.current = state.turnNumber;
        prevActivePlayerRef.current = state.activePlayerIndex;
        setSelectedTileIndex(null);
      }

      setGameState(state);

      if (state.turnPhase === 'GAME_OVER' && state.winnerId) {
        triggerHapticNotification('success');
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    });

    socket.on('error_message', (data: { message: string }) => {
      triggerHapticNotification('error');
      alert(data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_updated');
      socket.off('game_state');
      socket.off('error_message');
    };
  }, []);

  const handleCreateRoom = () => {
    socket.emit('create_room', { player: currentUser });
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit('join_room', { roomId, player: currentUser });
  };

  const handleAddBot = () => {
    if (currentRoom) {
      socket.emit('add_bot', { roomId: currentRoom.id });
    }
  };

  const handleStartGame = () => {
    if (currentRoom) {
      socket.emit('start_game', { roomId: currentRoom.id });
    }
  };

  const handleSendAction = (action: ClientAction) => {
    if (currentRoom) {
      socket.emit('game_action', {
        roomId: currentRoom.id,
        playerId: currentUser.id,
        action
      });
    }
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      socket.emit('leave_room', {
        roomId: currentRoom.id,
        playerId: currentUser.id
      });
    }
    setCurrentRoom(null);
    setGameState(null);
    setSelectedTileIndex(null);
  };

  return (
    <div className="flex flex-col h-full h-[100dvh] w-screen max-w-lg mx-auto bg-slate-950 overflow-hidden relative select-none font-sans safe-top-area safe-bottom-area">
      {!gameState ? (
        <LobbyView
          currentUser={currentUser}
          currentRoom={currentRoom}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onAddBot={handleAddBot}
          onStartGame={handleStartGame}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full justify-between relative overflow-hidden">
          {/* Top HUD with Confirmation Leave */}
          <HeaderHUD
            gameState={gameState}
            myPlayerId={currentUser.id}
            onConfirmLeave={handleLeaveRoom}
          />

          {/* 3D Isometric Game Board */}
          <GameBoard
            gameState={gameState}
            selectedTileIndex={selectedTileIndex}
            onSelectTile={(tileIdx) => setSelectedTileIndex(tileIdx)}
          />

          {/* Game Event Logs with 50% opacity */}
          <GameLogs logs={gameState.logs} />

          {/* Action Area & Selected Tile Bottom Sheet */}
          <BottomActionSheet
            gameState={gameState}
            myPlayerId={currentUser.id}
            selectedTileIndex={selectedTileIndex}
            onCloseInspect={() => setSelectedTileIndex(null)}
            onSendAction={handleSendAction}
          />

          {/* Winner Game Over Modal */}
          {gameState.turnPhase === 'GAME_OVER' && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">
                ПОБЕДИТЕЛЬ!
              </h2>
              <p className="text-lg font-bold text-amber-400 mb-6">
                {gameState.players.find((p) => p.id === gameState.winnerId)?.displayName}
              </p>
              <button
                onClick={handleLeaveRoom}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>В главное меню</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
