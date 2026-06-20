const TECHNIQUE_ORDER = [
  'Hash Map',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Prefix Sum',
  'Sorting',
  'Stack',
  'Queue / BFS',
  'DFS',
  'Backtracking',
  'Dynamic Programming',
  'Greedy',
  'Heap / Priority Queue',
  'Graph Traversal',
  'Topological Sort',
  'Union Find',
  'Trie',
  'Tree Traversal',
  'Recursion',
  'Divide and Conquer',
  'Bit Manipulation',
  'Math',
  'String Matching',
  'Matrix Traversal',
  'Monotonic Stack',
  'Design'
];

const TOPIC_TECHNIQUES = {
  Arrays: ['Hash Map'],
  Strings: ['Hash Map', 'String Matching'],
  'Two Pointers': ['Two Pointers'],
  'Sliding Window': ['Sliding Window', 'Hash Map'],
  'Sorting & Searching': ['Binary Search', 'Sorting'],
  'Dynamic Programming': ['Dynamic Programming'],
  'Math & Bit Manipulation': ['Math', 'Bit Manipulation'],
  'Prefix Sum': ['Prefix Sum'],
  Greedy: ['Greedy'],
  Backtracking: ['Backtracking', 'Recursion'],
  'Divide and Conquer': ['Divide and Conquer', 'Binary Search'],
  Trees: ['Tree Traversal', 'DFS', 'Recursion'],
  Graphs: ['Graph Traversal', 'DFS', 'Queue / BFS'],
  'Linked List': ['Two Pointers'],
  'Misc / General': ['Design']
};

const NAME_RULES = [
  [/two sum|contains duplicate|valid anagram|ransom note|jewels and stones|top k frequent|group anagrams|first unique|longest palindrome/i, ['Hash Map']],
  [/palindrome|3sum|container with most water|remove duplicates|remove element|move zeroes|merge sorted array|squares of a sorted array|sort array by parity|trapping rain water/i, ['Two Pointers']],
  [/substring|subarray|window|anagrams in a string|minimum window|fruit into baskets|maximum average/i, ['Sliding Window']],
  [/binary search|search insert|rotated sorted|minimum in rotated|peak element|sqrt|koko|ship packages|split array largest sum|median of two sorted arrays|search a 2d matrix/i, ['Binary Search']],
  [/pivot|running sum|subarray sum|product of array except self|range sum|prefix/i, ['Prefix Sum']],
  [/sort|sorted|h-index|merge intervals|kth largest|kth smallest/i, ['Sorting']],
  [/valid parentheses|min stack|daily temperatures|largest rectangle|maximal rectangle|asteroid collision|next greater/i, ['Stack']],
  [/daily temperatures|largest rectangle|maximal rectangle|next greater/i, ['Monotonic Stack']],
  [/level order|word ladder|shortest path|walls and gates|minimum genetic mutation|open lock|rotting oranges|islands/i, ['Queue / BFS']],
  [/number of islands|course schedule|network delay|cheapest flights|connected components|pacific atlantic|graph valid tree|redundant connection|itinerary|alien dictionary/i, ['Graph Traversal']],
  [/course schedule|alien dictionary|minimum height trees/i, ['Topological Sort']],
  [/accounts merge|stones removed|regions cut|connected components|redundant connection|graph valid tree/i, ['Union Find']],
  [/trie|word search ii|prefix tree/i, ['Trie']],
  [/combination|permutation|subsets|n-queens|sudoku|restore ip|word search|letter combinations|generate parentheses/i, ['Backtracking']],
  [/climbing stairs|house robber|coin change|longest increasing subsequence|partition equal subset|edit distance|distinct subsequences|burst balloons|interleaving|string matching|regular expression|wildcard|palindromic|integer break/i, ['Dynamic Programming']],
  [/jump game|gas station|task scheduler|ipo|course schedule iii|partition labels|candy|lemonade/i, ['Greedy']],
  [/top k|kth largest|kth smallest|median from data stream|merge k sorted|sliding window maximum|ipo|network delay/i, ['Heap / Priority Queue']],
  [/tree|bst|binary tree|path sum|diameter|same tree|symmetric|invert|serialize|deserialize|lowest common ancestor|maximum depth|minimum depth|balanced/i, ['Tree Traversal', 'DFS', 'Recursion']],
  [/divide|merge k sorted|different ways to add parentheses|kth largest|search a 2d matrix ii/i, ['Divide and Conquer']],
  [/bits|bit|single number|missing number|counting bits|number of 1 bits|reverse bits|find the difference/i, ['Bit Manipulation']],
  [/roman|integer|plus one|happy number|excel|power|sqrt|count digits|number of steps|good pairs|majority element/i, ['Math']],
  [/matrix|image|toeplitz|diagonal|game of life|spiral|set matrix|shortest path in binary matrix|longest increasing path/i, ['Matrix Traversal']],
  [/design|implement|min stack|queue using stacks|bst iterator|median from data stream|lru cache|trie/i, ['Design']]
];

function inferTechniques(problem) {
  if (Array.isArray(problem.techniques) && problem.techniques.length > 0) {
    return TECHNIQUE_ORDER.filter(technique => problem.techniques.includes(technique));
  }

  const techniques = new Set(TOPIC_TECHNIQUES[problem.topic] || []);
  const haystack = `${problem.name || ''} ${problem.topic || ''}`;

  NAME_RULES.forEach(([pattern, matches]) => {
    if (pattern.test(haystack)) {
      matches.forEach(technique => techniques.add(technique));
    }
  });

  if (techniques.size === 0) {
    techniques.add(problem.topic && problem.topic !== 'Misc / General' ? problem.topic : 'Design');
  }

  return TECHNIQUE_ORDER.filter(technique => techniques.has(technique));
}

module.exports = {
  TECHNIQUE_ORDER,
  inferTechniques
};
