import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getOrCreateScoutByName, getScout } from '@/core/lib/scoutGamificationUtils';
import { ScoutRole } from '@/core/types/scoutRole';
import { gamificationDB } from '@/game-template/gamification';

interface ScoutContextType {
  currentScout: string;
  currentScoutStakes: number;
  scoutsList: string[];
  playerStation: string;
  isLoading: boolean;

  currentScoutRoles: ScoutRole[];

  setCurrentScout: (name: string) => Promise<void>;
  setPlayerStation: (station: string) => void;
  addScout: (name: string) => Promise<void>;
  removeScout: (name: string) => Promise<void>;
  refreshScout: () => Promise<void>;

  updateScoutRoles: (role: ScoutRole[]) => void;
  toggleScoutRole: (role: ScoutRole) => void;
  toggleScoutRoleFor: (name: string, role: ScoutRole) => Promise<void>;
}

const ScoutContext = createContext<ScoutContextType | undefined>(undefined);

export const useScout = () => {
  const context = useContext(ScoutContext);
  if (!context) {
    throw new Error('useScout must be used within a ScoutProvider');
  }
  return context;
};

interface ScoutProviderProps {
  children: ReactNode;
}

export const ScoutProvider: React.FC<ScoutProviderProps> = ({ children }) => {
  const [currentScout, setCurrentScoutState] = useState<string>('');
  const [currentScoutStakes, setCurrentScoutStakes] = useState<number>(0);
  const [scoutsList, setScoutsList] = useState<string[]>([]);
  const [playerStation, setPlayerStationState] = useState<string>('');
  // track the last scouter who filled a specific role so GameStartPage can default correctly
  // stored in localStorage as 'lastDataScouter' and 'lastCommentScouter'
  const [isLoading, setIsLoading] = useState(true);
  const [currentScoutRoles, setCurrentScoutRoles] = useState<ScoutRole[]>([]);
  
  // Load initial data from localStorage
  const loadScouts = useCallback(async () => {
    try {
      // Load scouts list
      const savedScouts = localStorage.getItem('scoutsList');
      const scouts = savedScouts ? JSON.parse(savedScouts) : [];
      setScoutsList(scouts);

      // Load current scout
      const savedCurrentScout = localStorage.getItem('currentScout');
      if (savedCurrentScout) {
        setCurrentScoutState(savedCurrentScout);
        
        // Get scout stakes from database
        try {
          const scout = await getOrCreateScoutByName(savedCurrentScout);
          setCurrentScoutStakes(scout.stakes);
          setCurrentScoutRoles(scout.scoutRoles || []);
        } catch (error) {
          console.error('Error loading scout stakes:', error);
          setCurrentScoutStakes(0);
        }
      }

      // Load player station for current scout (fallback to global)
      let savedPlayerStation = '';
      if (savedCurrentScout) {
        savedPlayerStation = localStorage.getItem(`playerStation_${savedCurrentScout}`) || '';
      }
      if (!savedPlayerStation) {
        savedPlayerStation = localStorage.getItem('playerStation') || '';
      }
      if (savedPlayerStation) {
        setPlayerStationState(savedPlayerStation);
      }
    } catch (error) {
      console.error('Error loading scouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set current scout
  const setCurrentScout = useCallback(async (name: string) => {
    if (!name.trim()) return;

    const trimmedName = name.trim();
    
    try {
      // Create/get scout from database
      const scout = await getOrCreateScoutByName(trimmedName);
      
      // Update state
      setCurrentScoutState(trimmedName);
      setCurrentScoutStakes(scout.stakes);

      const roles = scout.scoutRoles || [];
      setCurrentScoutRoles(roles);

      // Update localStorage and role defaults
      localStorage.setItem('currentScout', trimmedName);
      if (roles.includes('dataScouter')) {
        localStorage.setItem('lastDataScouter', trimmedName);
      }
      if (roles.includes('commentScouter')) {
        localStorage.setItem('lastCommentScouter', trimmedName);
      }

      // Add to scouts list if not present
      if (!scoutsList.includes(trimmedName)) {
        const updatedList = [...scoutsList, trimmedName].sort();
        setScoutsList(updatedList);
        localStorage.setItem('scoutsList', JSON.stringify(updatedList));
      }
    } catch (error) {
      console.error('Error setting current scout:', error);
      throw error;
    }
  }, [scoutsList]);

  // Add a new scout to the list
  const addScout = useCallback(async (name: string) => {
    if (!name.trim()) return;

    const trimmedName = name.trim();
    
    if (scoutsList.includes(trimmedName)) {
      // Scout already exists, just set as current
      await setCurrentScout(trimmedName);
      return;
    }

    try {
      // Create scout in database
      const scout = await getOrCreateScoutByName(trimmedName);
      
      // Update scouts list
      const updatedList = [...scoutsList, trimmedName].sort();
      setScoutsList(updatedList);
      localStorage.setItem('scoutsList', JSON.stringify(updatedList));
      
      // Set as current scout
      setCurrentScoutState(trimmedName);
      setCurrentScoutStakes(scout.stakes);
      localStorage.setItem('currentScout', trimmedName);
      
      console.log('✅ ScoutContext: Scout set to', trimmedName);
    } catch (error) {
      console.error('Error adding scout:', error);
      throw error;
    }
  }, [scoutsList, setCurrentScout]);

  // Remove a scout from the list
  const removeScout = useCallback(async (name: string) => {
    const updatedList = scoutsList.filter(s => s !== name);
    setScoutsList(updatedList);
    localStorage.setItem('scoutsList', JSON.stringify(updatedList));

    // If removing current scout, clear it
    if (currentScout === name) {
      setCurrentScoutState('');
      setCurrentScoutStakes(0);
      localStorage.removeItem('currentScout');
    }
  }, [scoutsList, currentScout]);

  // Set player station (persist per scout if available)
  const setPlayerStation = useCallback((station: string) => {
    setPlayerStationState(station);
    const key = currentScout ? `playerStation_${currentScout}` : 'playerStation';
    localStorage.setItem(key, station);
    // notify listeners that station changed
    window.dispatchEvent(new Event('playerStationChanged'));
  }, [currentScout]);

  // Refresh current scout data
  const refreshScout = useCallback(async () => {
    if (!currentScout) return;

    try {
      const scout = await getScout(currentScout);
      if (scout) {
        setCurrentScoutStakes(scout.stakes);
      }
    } catch (error) {
      console.error('Error refreshing scout:', error);
    }
  }, [currentScout]);

  const updateScoutRoles = useCallback((roles: ScoutRole[]) => {
    setCurrentScoutRoles(roles);
    localStorage.setItem('currentScoutRoles', JSON.stringify(roles));

    // update default mapping if needed
    if (currentScout) {
      if (roles.includes('dataScouter')) {
        localStorage.setItem('lastDataScouter', currentScout);
      }
      if (roles.includes('commentScouter')) {
        localStorage.setItem('lastCommentScouter', currentScout);
      }
    }

    // Persist to DB and notify other windows/components
    (async () => {
      try {
        if (!currentScout) return;
        const scout = await getScout(currentScout) || await getOrCreateScoutByName(currentScout);
        if (scout) {
          // ensure scout object has scoutRoles
          // @ts-ignore - underlying DB Scout type
          scout.scoutRoles = roles;
          await gamificationDB.scouts.put(scout);
          window.dispatchEvent(new Event('scoutChanged'));
        }
      } catch (err) {
        console.error('Error persisting scout roles:', err);
      }
    })();
  }, [currentScout]);

  const toggleScoutRole = useCallback((role: ScoutRole) => {
    // Compute updated roles based on current state, then persist
    const updatedRoles = currentScoutRoles.includes(role)
      ? currentScoutRoles.filter(r => r !== role)
      : [...currentScoutRoles, role];

    setCurrentScoutRoles(updatedRoles);
    localStorage.setItem('currentScoutRoles', JSON.stringify(updatedRoles));

    // update default mapping if we just added a role
    if (currentScout) {
      if (updatedRoles.includes('dataScouter')) {
        localStorage.setItem('lastDataScouter', currentScout);
      }
      if (updatedRoles.includes('commentScouter')) {
        localStorage.setItem('lastCommentScouter', currentScout);
      }
    }

    // Persist to DB and notify other windows/components
    (async () => {
      try {
        if (!currentScout) return;
        const scout = await getScout(currentScout) || await getOrCreateScoutByName(currentScout);
        if (scout) {
          // @ts-ignore
          scout.scoutRoles = updatedRoles;
          await gamificationDB.scouts.put(scout);
          window.dispatchEvent(new Event('scoutChanged'));
        }
      } catch (err) {
        console.error('Error persisting toggled scout role:', err);
      }
    })();
  }, [currentScout, currentScoutRoles]);

  // Toggle role for arbitrary scout (persist to DB)
  const toggleScoutRoleFor = useCallback(async (name: string, role: ScoutRole) => {
    try {
      if (!name) return;
      const scout = await getScout(name) || await getOrCreateScoutByName(name);
      if (!scout) return;

      const prevRoles: ScoutRole[] = scout.scoutRoles || [];
      const updatedRoles: ScoutRole[] = prevRoles.includes(role) ? prevRoles.filter(r => r !== role) : [...prevRoles, role];

      // @ts-ignore
      scout.scoutRoles = updatedRoles;
      await gamificationDB.scouts.put(scout);

      // If we're updating the currently selected scout, sync local state
      if (name === currentScout) {
        setCurrentScoutRoles(updatedRoles);
        localStorage.setItem('currentScoutRoles', JSON.stringify(updatedRoles));
      }

      // Notify other listeners/tabs
      window.dispatchEvent(new Event('scoutChanged'));
    } catch (err) {
      console.error('Error toggling scout role for', name, err);
    }
  }, [currentScout]);

  // Load scouts on mount
  useEffect(() => {
    loadScouts();
  }, [loadScouts]);

  // whenever currentScout changes, reload their station from storage
  useEffect(() => {
    if (currentScout) {
      const saved = localStorage.getItem(`playerStation_${currentScout}`) || '';
      if (saved) {
        setPlayerStationState(saved);
      }
    }
  }, [currentScout]);

  // Listen for external scout changes (from other components or demo generator)
  useEffect(() => {
    const handleScoutChanged = () => {
      loadScouts();
    };

    const handleScoutDataCleared = () => {
      // Clear state immediately
      setCurrentScoutState('');
      setCurrentScoutStakes(0);
      setScoutsList([]);
      setPlayerStationState('');
    };

    const handlePlayerStationChanged = () => {
      const newStation = localStorage.getItem('playerStation') || '';
      setPlayerStationState(newStation);
    };

    window.addEventListener('scoutChanged', handleScoutChanged);
    window.addEventListener('scoutDataCleared', handleScoutDataCleared);
    window.addEventListener('playerStationChanged', handlePlayerStationChanged);
    
    return () => {
      window.removeEventListener('scoutChanged', handleScoutChanged);
      window.removeEventListener('scoutDataCleared', handleScoutDataCleared);
      window.removeEventListener('playerStationChanged', handlePlayerStationChanged);
    };
  }, [loadScouts]);

  const value: ScoutContextType = {
    currentScout,
    currentScoutStakes,
    scoutsList,
    playerStation,
    isLoading,
    
    currentScoutRoles,
    
    setCurrentScout,
    setPlayerStation,
    addScout,
    removeScout,
    refreshScout,

    updateScoutRoles,
    toggleScoutRole,
    toggleScoutRoleFor,

  };

  return <ScoutContext.Provider value={value}>{children}</ScoutContext.Provider>;
};
