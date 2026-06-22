import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { inferTechniques, sortTechniqueGroups } from '../utils/techniques';

const DataContext = createContext();
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function DataProvider({ children }) {
  const { user, isGuest } = useAuth();
  const [data, setData] = useState([]);
  const [topicInfo, setTopicInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const guestFlag = localStorage.getItem('dsa_guest') === 'true';
    if (!user && !isGuest && !guestFlag) return;
    fetchData();
  }, [user, isGuest]);

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (user) {
      headers['Authorization'] = `Bearer ${user.token}`;
      headers['X-Username'] = user.username;
    }
    return headers;
  };

  const readGuestCache = () => {
    const cached = localStorage.getItem('dsa_progress_guest');
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem('dsa_progress_guest');
      return null;
    }
  };

  const applyGuestCache = (levels, cachedLevels) => {
    if (!cachedLevels) {
      return levels.map(lvl => ({
        ...lvl,
        problems: lvl.problems.map(p => ({ ...p, solved: false, revised: false }))
      }));
    }

    const progressMap = new Map();
    cachedLevels.forEach(level => {
      level.problems?.forEach((problem, index) => {
        progressMap.set(`${level.level}-${index}`, {
          solved: Boolean(problem.solved),
          solvedAt: problem.solvedAt,
          revised: Boolean(problem.revised),
          revisedAt: problem.revisedAt
        });
      });
    });

    return levels.map(lvl => ({
      ...lvl,
      problems: lvl.problems.map((p, index) => {
        const cached = progressMap.get(`${lvl.level}-${index}`);
        return {
          ...p,
          solved: Boolean(cached?.solved),
          revised: Boolean(cached?.revised),
          ...(cached?.solved && cached.solvedAt ? { solvedAt: cached.solvedAt } : {}),
          ...(cached?.revised && cached.revisedAt ? { revisedAt: cached.revisedAt } : {})
        };
      })
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // TEST MODE: artificial 2 second delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch levels
      const guestMode = !user && (isGuest || localStorage.getItem('dsa_guest') === 'true');
      if (guestMode) {
        const cached = readGuestCache();
        try {
          const res = await fetch(`${API_BASE}/levels`);
          if (!res.ok) throw new Error('Failed to fetch levels');
          const raw = await res.json();
          const clean = applyGuestCache(raw, cached);
          setData(clean);
          localStorage.setItem('dsa_progress_guest', JSON.stringify(clean));
        } catch (guestErr) {
          if (!cached) throw guestErr;
          setData(cached);
        }
      } else {
        const res = await fetch(`${API_BASE}/levels`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch levels');
        setData(await res.json());
      }

      // Fetch all topic info and store as map keyed by topic name
      const tiRes = await fetch(`${API_BASE}/topic-info`);
      if (tiRes.ok) {
        const tiList = await tiRes.json();
        const tiMap = {};
        tiList.forEach(t => { tiMap[t.topic] = t; });
        setTopicInfo(tiMap);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProblemStatus = async (originalLevel, originalIndex, currentStatus) => {
    const newStatus = !currentStatus;
    
    // Create new data array synchronously to use for both state update and local storage
    const newData = [...data];
    const idx = newData.findIndex(d => d.level === originalLevel);
    if (idx !== -1) {
      const updatedLevel = { ...newData[idx] };
      const updatedProblems = [...updatedLevel.problems];
      const updatedProblem = { ...updatedProblems[originalIndex], solved: newStatus };
      if (newStatus) {
        updatedProblem.solvedAt = new Date().toISOString();
      } else {
        delete updatedProblem.solvedAt;
      }
      updatedProblems[originalIndex] = updatedProblem;
      updatedLevel.problems = updatedProblems;
      newData[idx] = updatedLevel;
    }

    // Update state
    setData(newData);

    const guestMode = !user && (isGuest || localStorage.getItem('dsa_guest') === 'true');
    if (guestMode) {
      localStorage.setItem('dsa_progress_guest', JSON.stringify(newData));
    } else {
      try {
        const payload = { solved: newStatus };
        // include timestamp when marking solved
        if (newStatus) payload.solvedAt = new Date().toISOString();
        const res = await fetch(`${API_BASE}/levels/${originalLevel}/problem/${originalIndex}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Update failed on server');
      } catch (err) {
        console.error('Update failed:', err);
        setData(prevData => {
          const newData = [...prevData];
          const idx = newData.findIndex(d => d.level === originalLevel);
          if (idx !== -1) {
            const updatedLevel = { ...newData[idx] };
            const updatedProblems = [...updatedLevel.problems];
            updatedProblems[originalIndex] = { ...updatedProblems[originalIndex], solved: currentStatus };
            updatedLevel.problems = updatedProblems;
            newData[idx] = updatedLevel;
          }
          return newData;
        });
      }
    }
  };

  const toggleRevisionStatus = async (originalLevel, originalIndex, currentStatus) => {
    const newStatus = !currentStatus;
    
    const newData = [...data];
    const idx = newData.findIndex(d => d.level === originalLevel);
    if (idx !== -1) {
      const updatedLevel = { ...newData[idx] };
      const updatedProblems = [...updatedLevel.problems];
      const updatedProblem = { ...updatedProblems[originalIndex], revised: newStatus };
      if (newStatus) {
        updatedProblem.revisedAt = new Date().toISOString();
      } else {
        delete updatedProblem.revisedAt;
      }
      updatedProblems[originalIndex] = updatedProblem;
      updatedLevel.problems = updatedProblems;
      newData[idx] = updatedLevel;
    }

    setData(newData);

    const guestMode = !user && (isGuest || localStorage.getItem('dsa_guest') === 'true');
    if (guestMode) {
      localStorage.setItem('dsa_progress_guest', JSON.stringify(newData));
    } else {
      try {
        const payload = { revised: newStatus };
        if (newStatus) payload.revisedAt = new Date().toISOString();
        const res = await fetch(`${API_BASE}/levels/${originalLevel}/problem/${originalIndex}/revise`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Update revised failed on server');
      } catch (err) {
        console.error('Update revised failed:', err);
        setData(prevData => {
          const newData = [...prevData];
          const idx = newData.findIndex(d => d.level === originalLevel);
          if (idx !== -1) {
            const updatedLevel = { ...newData[idx] };
            const updatedProblems = [...updatedLevel.problems];
            updatedProblems[originalIndex] = { ...updatedProblems[originalIndex], revised: currentStatus };
            updatedLevel.problems = updatedProblems;
            newData[idx] = updatedLevel;
          }
          return newData;
        });
      }
    }
  };

  const getTopicData = () => {
    const topicsMap = new Map();
    data.forEach(levelObj => {
      levelObj.problems.forEach((prob, index) => {
        if (!topicsMap.has(prob.topic)) topicsMap.set(prob.topic, []);
        topicsMap.get(prob.topic).push({
          ...prob,
          techniques: inferTechniques(prob),
          originalLevel: levelObj.level,
          originalIndex: index
        });
      });
    });
    return Array.from(topicsMap.keys())
      .map(topic => ({ topic, problems: topicsMap.get(topic) }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  };

  const getTechniqueData = () => {
    const techniquesMap = new Map();
    data.forEach(levelObj => {
      levelObj.problems.forEach((prob, index) => {
        const techniques = inferTechniques(prob);
        techniques.forEach(technique => {
          if (!techniquesMap.has(technique)) techniquesMap.set(technique, []);
          techniquesMap.get(technique).push({
            ...prob,
            techniques,
            originalLevel: levelObj.level,
            originalIndex: index
          });
        });
      });
    });

    return sortTechniqueGroups(
      Array.from(techniquesMap.keys()).map(topic => ({
        topic,
        problems: techniquesMap.get(topic)
      }))
    );
  };

  return (
    <DataContext.Provider value={{ data, topicInfo, loading, error, toggleProblemStatus, toggleRevisionStatus, getTopicData, getTechniqueData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
