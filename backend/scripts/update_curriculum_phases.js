const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, 'data', 'problems.json');

function updateCurriculum() {
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

  // Separate phases 1-7
  const earlyPhases = data.filter(p => p.level < 8);
  const phase8Old = data.find(p => p.level === 8);
  const laterPhases = data.filter(p => p.level > 8);

  if (!phase8Old) {
    console.log("Phase 8 not found");
    return;
  }

  const problems = phase8Old.problems;

  // Group problems by topic
  const heaps = problems.filter(p => p.topic === 'Heap / Priority Queue');
  const graphs = problems.filter(p => p.topic === 'Graphs' || p.topic === 'Advanced Graphs');
  const greedy = problems.filter(p => p.topic === 'Greedy' || p.topic === 'Intervals');
  const backtracking = problems.filter(p => p.topic === 'Backtracking');
  const dp = problems.filter(p => p.topic === '1-D Dynamic Programming' || p.topic === '2-D Dynamic Programming' || p.topic === 'Dynamic Programming');

  // Any other problems? Put them in the most appropriate or Greedy
  const assigned = [...heaps, ...graphs, ...greedy, ...backtracking, ...dp];
  const unassigned = problems.filter(p => !assigned.includes(p));
  if (unassigned.length > 0) {
    console.log("Unassigned problems found, appending to Greedy for now:", unassigned.map(p => p.name));
    greedy.push(...unassigned);
  }

  const newPhases = [
    {
      level: 8,
      goal: "Heap",
      description: "Master Priority Queues and Heap structures.",
      problems: heaps
    },
    {
      level: 9,
      goal: "Graph",
      description: "Master Graph Traversals, Shortest Paths, and Minimum Spanning Trees.",
      problems: graphs
    },
    {
      level: 10,
      goal: "Greedy",
      description: "Master Greedy algorithms and Interval logic.",
      problems: greedy
    },
    {
      level: 11,
      goal: "Backtracking",
      description: "Master Combinatorics and Exhaustive Search.",
      problems: backtracking
    },
    {
      level: 12,
      goal: "Dynamic Programming",
      description: "Master State Transition, Memoization, and Tabulation.",
      problems: dp
    }
  ];

  // Adjust levels of any phases that were originally > 8 (if any existed, though 8 was the last one)
  const adjustedLaterPhases = laterPhases.map(phase => {
    phase.level = phase.level + 4; // Shifted by 4 new phases (9, 10, 11, 12)
    return phase;
  });

  const newData = [...earlyPhases, ...newPhases, ...adjustedLaterPhases];

  fs.writeFileSync(JSON_FILE, JSON.stringify(newData, null, 2));
  console.log(`Successfully split Phase 8 into 5 distinct phases.`);
  console.log(`New Phase counts: Heap (${heaps.length}), Graph (${graphs.length}), Greedy (${greedy.length}), Backtracking (${backtracking.length}), DP (${dp.length})`);
}

updateCurriculum();
