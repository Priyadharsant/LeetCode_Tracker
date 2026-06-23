const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'leetcode_tracker';

const cheatsheetData = [
  {
    language: 'Java',
    dataStructures: [
      { name: 'Array', declaration: 'int[] arr = new int[n];', timeComplexity: 'Access: O(1), Search: O(n)', apis: [{ name: 'Arrays.sort()', complexity: 'O(n log n)' }, { name: 'Arrays.fill()', complexity: 'O(n)' }, { name: 'Arrays.binarySearch()', complexity: 'O(log n)' }, { name: 'Arrays.copyOf()', complexity: 'O(n)' }, { name: 'Arrays.toString()', complexity: 'O(n)' }] },
      { name: 'String', declaration: 'String s = "abc";', timeComplexity: 'Access: O(1), Search: O(n)', apis: [{ name: 'length()', complexity: 'O(1)' }, { name: 'charAt()', complexity: 'O(1)' }, { name: 'substring()', complexity: 'O(n)' }, { name: 'indexOf()', complexity: 'O(n)' }, { name: 'contains()', complexity: 'O(n)' }, { name: 'split()', complexity: 'O(n)' }, { name: 'equals()', complexity: 'O(n)' }] },
      { name: 'StringBuilder', declaration: 'StringBuilder sb = new StringBuilder();', timeComplexity: 'Append: O(1) amortized', apis: [{ name: 'append()', complexity: 'O(1) amortized' }, { name: 'insert()', complexity: 'O(n)' }, { name: 'delete()', complexity: 'O(n)' }, { name: 'reverse()', complexity: 'O(n)' }, { name: 'setCharAt()', complexity: 'O(1)' }, { name: 'toString()', complexity: 'O(n)' }] },
      { name: 'ArrayList', declaration: 'ArrayList<Integer> list = new ArrayList<>();', timeComplexity: 'Access: O(1), Insert/Delete: O(n)', apis: [{ name: 'add()', complexity: 'O(1) amortized' }, { name: 'get()', complexity: 'O(1)' }, { name: 'set()', complexity: 'O(1)' }, { name: 'remove()', complexity: 'O(n)' }, { name: 'contains()', complexity: 'O(n)' }, { name: 'size()', complexity: 'O(1)' }] },
      { name: 'LinkedList', declaration: 'LinkedList<Integer> ll = new LinkedList<>();', timeComplexity: 'Insert/Delete: O(1)', apis: [{ name: 'addFirst()', complexity: 'O(1)' }, { name: 'addLast()', complexity: 'O(1)' }, { name: 'removeFirst()', complexity: 'O(1)' }, { name: 'removeLast()', complexity: 'O(1)' }, { name: 'getFirst()', complexity: 'O(1)' }, { name: 'getLast()', complexity: 'O(1)' }] },
      { name: 'Stack', declaration: 'Stack<Integer> st = new Stack<>();', timeComplexity: 'All: O(1)', apis: [{ name: 'push()', complexity: 'O(1)' }, { name: 'pop()', complexity: 'O(1)' }, { name: 'peek()', complexity: 'O(1)' }, { name: 'empty()', complexity: 'O(1)' }, { name: 'size()', complexity: 'O(1)' }] },
      { name: 'Queue', declaration: 'Queue<Integer> q = new LinkedList<>();', timeComplexity: 'All: O(1)', apis: [{ name: 'offer()', complexity: 'O(1)' }, { name: 'poll()', complexity: 'O(1)' }, { name: 'peek()', complexity: 'O(1)' }, { name: 'isEmpty()', complexity: 'O(1)' }] },
      { name: 'Deque', declaration: 'Deque<Integer> dq = new ArrayDeque<>();', timeComplexity: 'All: O(1)', apis: [{ name: 'offerFirst()', complexity: 'O(1)' }, { name: 'offerLast()', complexity: 'O(1)' }, { name: 'pollFirst()', complexity: 'O(1)' }, { name: 'pollLast()', complexity: 'O(1)' }, { name: 'peekFirst()', complexity: 'O(1)' }, { name: 'peekLast()', complexity: 'O(1)' }] },
      { name: 'HashSet', declaration: 'HashSet<Integer> set = new HashSet<>();', timeComplexity: 'Average: O(1)', apis: [{ name: 'add()', complexity: 'O(1)' }, { name: 'remove()', complexity: 'O(1)' }, { name: 'contains()', complexity: 'O(1)' }, { name: 'size()', complexity: 'O(1)' }, { name: 'isEmpty()', complexity: 'O(1)' }] },
      { name: 'TreeSet', declaration: 'TreeSet<Integer> ts = new TreeSet<>();', timeComplexity: 'All: O(log n)', apis: [{ name: 'add()', complexity: 'O(log n)' }, { name: 'first()', complexity: 'O(log n)' }, { name: 'last()', complexity: 'O(log n)' }, { name: 'ceiling()', complexity: 'O(log n)' }, { name: 'floor()', complexity: 'O(log n)' }, { name: 'higher()', complexity: 'O(log n)' }, { name: 'lower()', complexity: 'O(log n)' }] },
      { name: 'HashMap', declaration: 'HashMap<Integer,Integer> map = new HashMap<>();', timeComplexity: 'Average: O(1)', apis: [{ name: 'put()', complexity: 'O(1)' }, { name: 'get()', complexity: 'O(1)' }, { name: 'getOrDefault()', complexity: 'O(1)' }, { name: 'containsKey()', complexity: 'O(1)' }, { name: 'remove()', complexity: 'O(1)' }, { name: 'keySet()', complexity: 'O(n)' }, { name: 'entrySet()', complexity: 'O(n)' }] },
      { name: 'TreeMap', declaration: 'TreeMap<Integer,Integer> tm = new TreeMap<>();', timeComplexity: 'All: O(log n)', apis: [{ name: 'put()', complexity: 'O(log n)' }, { name: 'get()', complexity: 'O(log n)' }, { name: 'firstKey()', complexity: 'O(log n)' }, { name: 'lastKey()', complexity: 'O(log n)' }, { name: 'ceilingKey()', complexity: 'O(log n)' }, { name: 'floorKey()', complexity: 'O(log n)' }] },
      { name: 'PriorityQueue (Min Heap)', declaration: 'PriorityQueue<Integer> pq = new PriorityQueue<>();', timeComplexity: 'Insert/Delete: O(log n)', apis: [{ name: 'offer()', complexity: 'O(log n)' }, { name: 'poll()', complexity: 'O(log n)' }, { name: 'peek()', complexity: 'O(1)' }, { name: 'size()', complexity: 'O(1)' }] },
      { name: 'PriorityQueue (Max Heap)', declaration: 'PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());', timeComplexity: 'Insert/Delete: O(log n)', apis: [{ name: 'offer()', complexity: 'O(log n)' }, { name: 'poll()', complexity: 'O(log n)' }, { name: 'peek()', complexity: 'O(1)' }] }
    ],
    utilities: [
      { class: 'Arrays', apis: [{ name: 'sort()', complexity: 'O(n log n)' }, { name: 'fill()', complexity: 'O(n)' }, { name: 'binarySearch()', complexity: 'O(log n)' }, { name: 'copyOf()', complexity: 'O(n)' }, { name: 'equals()', complexity: 'O(n)' }, { name: 'toString()', complexity: 'O(n)' }] },
      { class: 'Collections', apis: [{ name: 'sort()', complexity: 'O(n log n)' }, { name: 'reverse()', complexity: 'O(n)' }, { name: 'max()', complexity: 'O(n)' }, { name: 'min()', complexity: 'O(n)' }, { name: 'frequency()', complexity: 'O(n)' }, { name: 'reverseOrder()', complexity: 'O(1)' }] },
      { class: 'Math', apis: [{ name: 'max()', complexity: 'O(1)' }, { name: 'min()', complexity: 'O(1)' }, { name: 'abs()', complexity: 'O(1)' }, { name: 'sqrt()', complexity: 'O(1)' }, { name: 'pow()', complexity: 'O(1)' }, { name: 'ceil()', complexity: 'O(1)' }, { name: 'floor()', complexity: 'O(1)' }] }
    ],
    topPriority: ['Arrays', 'Strings & StringBuilder', 'HashMap', 'HashSet', 'Stack / Deque', 'Queue', 'PriorityQueue', 'ArrayList', 'TreeMap / TreeSet']
  },
  {
    language: 'Python',
    dataStructures: [
      { name: 'List (Array)', declaration: 'arr = [1, 2, 3]', timeComplexity: 'Access: O(1), Insert/Delete: O(n)', apis: [{ name: 'append()', complexity: 'O(1) amortized' }, { name: 'pop()', complexity: 'O(1)' }, { name: 'insert()', complexity: 'O(n)' }, { name: 'remove()', complexity: 'O(n)' }, { name: 'sort()', complexity: 'O(n log n)' }, { name: 'reverse()', complexity: 'O(n)' }, { name: 'index()', complexity: 'O(n)' }] },
      { name: 'String', declaration: 's = "abc"', timeComplexity: 'Access: O(1), Search: O(n)', apis: [{ name: 'len()', complexity: 'O(1)' }, { name: 'split()', complexity: 'O(n)' }, { name: 'join()', complexity: 'O(n)' }, { name: 'replace()', complexity: 'O(n)' }, { name: 'find()', complexity: 'O(n)' }, { name: 'startswith()', complexity: 'O(n)' }, { name: 'endswith()', complexity: 'O(n)' }] },
      { name: 'Dictionary (HashMap)', declaration: 'd = {"a": 1}', timeComplexity: 'Average: O(1)', apis: [{ name: 'd[k] = v', complexity: 'O(1)' }, { name: 'd.get()', complexity: 'O(1)' }, { name: 'd.keys()', complexity: 'O(n)' }, { name: 'd.values()', complexity: 'O(n)' }, { name: 'd.items()', complexity: 'O(n)' }, { name: 'd.pop()', complexity: 'O(1)' }] },
      { name: 'Set (HashSet)', declaration: 's = set([1, 2])', timeComplexity: 'Average: O(1)', apis: [{ name: 'add()', complexity: 'O(1)' }, { name: 'remove()', complexity: 'O(1)' }, { name: 'discard()', complexity: 'O(1)' }, { name: 'pop()', complexity: 'O(1)' }, { name: 'union()', complexity: 'O(len(s) + len(t))' }, { name: 'intersection()', complexity: 'O(min(len(s), len(t)))' }] },
      { name: 'Tuple', declaration: 't = (1, 2, 3)', timeComplexity: 'Access: O(1)', apis: [{ name: 'count()', complexity: 'O(n)' }, { name: 'index()', complexity: 'O(n)' }, { name: 'len()', complexity: 'O(1)' }] },
      { name: 'Deque (Queue/Stack)', declaration: 'from collections import deque\nq = deque()', timeComplexity: 'Ends: O(1), Middle: O(n)', apis: [{ name: 'append()', complexity: 'O(1)' }, { name: 'appendleft()', complexity: 'O(1)' }, { name: 'pop()', complexity: 'O(1)' }, { name: 'popleft()', complexity: 'O(1)' }] },
      { name: 'Heap (Min Priority Queue)', declaration: 'import heapq\nhq = []', timeComplexity: 'Push/Pop: O(log n)', apis: [{ name: 'heapq.heappush()', complexity: 'O(log n)' }, { name: 'heapq.heappop()', complexity: 'O(log n)' }, { name: 'heapq.heapify()', complexity: 'O(n)' }] },
      { name: 'DefaultDict', declaration: 'from collections import defaultdict\nd = defaultdict(int)', timeComplexity: 'Average: O(1)', apis: [{ name: 'Automatic default values', complexity: 'O(1)' }] },
      { name: 'Counter', declaration: 'from collections import Counter\nc = Counter(arr)', timeComplexity: 'Creation: O(n)', apis: [{ name: 'most_common()', complexity: 'O(n log k)' }, { name: 'elements()', complexity: 'O(n)' }, { name: 'update()', complexity: 'O(n)' }] }
    ],
    utilities: [
      { class: 'Built-in Functions', apis: [{ name: 'len()', complexity: 'O(1)' }, { name: 'max()', complexity: 'O(n)' }, { name: 'min()', complexity: 'O(n)' }, { name: 'sum()', complexity: 'O(n)' }, { name: 'abs()', complexity: 'O(1)' }, { name: 'divmod()', complexity: 'O(1)' }, { name: 'pow()', complexity: 'O(1)' }, { name: 'sorted()', complexity: 'O(n log n)' }, { name: 'reversed()', complexity: 'O(n)' }, { name: 'enumerate()', complexity: 'O(1)' }, { name: 'zip()', complexity: 'O(1)' }] },
      { class: 'math module', apis: [{ name: 'math.ceil()', complexity: 'O(1)' }, { name: 'math.floor()', complexity: 'O(1)' }, { name: 'math.sqrt()', complexity: 'O(1)' }, { name: 'math.gcd()', complexity: 'O(log(min(a, b)))' }, { name: 'math.inf', complexity: 'O(1)' }] },
      { class: 'bisect module', apis: [{ name: 'bisect.bisect_left()', complexity: 'O(log n)' }, { name: 'bisect.bisect_right()', complexity: 'O(log n)' }, { name: 'bisect.insort()', complexity: 'O(n)' }] }
    ],
    topPriority: ['List', 'Dictionary (HashMap)', 'Set (HashSet)', 'String', 'Deque', 'Heap (heapq)', 'Counter', 'DefaultDict', 'Tuple']
  },
  {
    language: 'C++',
    dataStructures: [
      { name: 'Vector (ArrayList)', declaration: 'vector<int> v(n, 0);', timeComplexity: 'Access: O(1), Insert/Delete: O(n)', apis: [{ name: 'push_back()', complexity: 'O(1) amortized' }, { name: 'pop_back()', complexity: 'O(1)' }, { name: 'size()', complexity: 'O(1)' }, { name: 'empty()', complexity: 'O(1)' }, { name: 'v.begin()', complexity: 'O(1)' }, { name: 'v.end()', complexity: 'O(1)' }, { name: 'v.resize()', complexity: 'O(n)' }] },
      { name: 'String', declaration: 'string s = "abc";', timeComplexity: 'Access: O(1), Search: O(n)', apis: [{ name: 'length()', complexity: 'O(1)' }, { name: 'substr()', complexity: 'O(n)' }, { name: 'find()', complexity: 'O(n)' }, { name: 'push_back()', complexity: 'O(1) amortized' }, { name: 'pop_back()', complexity: 'O(1)' }, { name: 'append()', complexity: 'O(n)' }] },
      { name: 'Unordered Map (HashMap)', declaration: 'unordered_map<int, int> umap;', timeComplexity: 'Average: O(1)', apis: [{ name: 'umap[k] = v', complexity: 'O(1)' }, { name: 'insert()', complexity: 'O(1)' }, { name: 'find()', complexity: 'O(1)' }, { name: 'erase()', complexity: 'O(1)' }, { name: 'count()', complexity: 'O(1)' }] },
      { name: 'Unordered Set (HashSet)', declaration: 'unordered_set<int> uset;', timeComplexity: 'Average: O(1)', apis: [{ name: 'insert()', complexity: 'O(1)' }, { name: 'find()', complexity: 'O(1)' }, { name: 'erase()', complexity: 'O(1)' }, { name: 'count()', complexity: 'O(1)' }] },
      { name: 'Map (TreeMap)', declaration: 'map<int, int> m;', timeComplexity: 'All: O(log n)', apis: [{ name: 'insert()', complexity: 'O(log n)' }, { name: 'find()', complexity: 'O(log n)' }, { name: 'erase()', complexity: 'O(log n)' }, { name: 'lower_bound()', complexity: 'O(log n)' }, { name: 'upper_bound()', complexity: 'O(log n)' }] },
      { name: 'Set (TreeSet)', declaration: 'set<int> s;', timeComplexity: 'All: O(log n)', apis: [{ name: 'insert()', complexity: 'O(log n)' }, { name: 'find()', complexity: 'O(log n)' }, { name: 'erase()', complexity: 'O(log n)' }, { name: 'lower_bound()', complexity: 'O(log n)' }, { name: 'upper_bound()', complexity: 'O(log n)' }] },
      { name: 'Priority Queue (Max Heap)', declaration: 'priority_queue<int> pq;', timeComplexity: 'Push/Pop: O(log n)', apis: [{ name: 'push()', complexity: 'O(log n)' }, { name: 'pop()', complexity: 'O(log n)' }, { name: 'top()', complexity: 'O(1)' }, { name: 'empty()', complexity: 'O(1)' }, { name: 'size()', complexity: 'O(1)' }] },
      { name: 'Priority Queue (Min Heap)', declaration: 'priority_queue<int, vector<int>, greater<int>> pq;', timeComplexity: 'Push/Pop: O(log n)', apis: [{ name: 'push()', complexity: 'O(log n)' }, { name: 'pop()', complexity: 'O(log n)' }, { name: 'top()', complexity: 'O(1)' }, { name: 'empty()', complexity: 'O(1)' }] },
      { name: 'Deque', declaration: 'deque<int> dq;', timeComplexity: 'Ends: O(1)', apis: [{ name: 'push_front()', complexity: 'O(1)' }, { name: 'push_back()', complexity: 'O(1)' }, { name: 'pop_front()', complexity: 'O(1)' }, { name: 'pop_back()', complexity: 'O(1)' }, { name: 'front()', complexity: 'O(1)' }, { name: 'back()', complexity: 'O(1)' }] },
      { name: 'Stack', declaration: 'stack<int> st;', timeComplexity: 'All: O(1)', apis: [{ name: 'push()', complexity: 'O(1)' }, { name: 'pop()', complexity: 'O(1)' }, { name: 'top()', complexity: 'O(1)' }, { name: 'empty()', complexity: 'O(1)' }] },
      { name: 'Queue', declaration: 'queue<int> q;', timeComplexity: 'All: O(1)', apis: [{ name: 'push()', complexity: 'O(1)' }, { name: 'pop()', complexity: 'O(1)' }, { name: 'front()', complexity: 'O(1)' }, { name: 'back()', complexity: 'O(1)' }, { name: 'empty()', complexity: 'O(1)' }] },
      { name: 'Pair', declaration: 'pair<int, int> p = {1, 2};', timeComplexity: 'Access: O(1)', apis: [{ name: 'p.first', complexity: 'O(1)' }, { name: 'p.second', complexity: 'O(1)' }, { name: 'make_pair()', complexity: 'O(1)' }] }
    ],
    utilities: [
      { class: '<algorithm>', apis: [{ name: 'sort()', complexity: 'O(n log n)' }, { name: 'reverse()', complexity: 'O(n)' }, { name: 'max()', complexity: 'O(1)' }, { name: 'min()', complexity: 'O(1)' }, { name: 'swap()', complexity: 'O(1)' }, { name: 'lower_bound()', complexity: 'O(log n)' }, { name: 'upper_bound()', complexity: 'O(log n)' }, { name: 'next_permutation()', complexity: 'O(n)' }] },
      { class: '<cmath>', apis: [{ name: 'abs()', complexity: 'O(1)' }, { name: 'sqrt()', complexity: 'O(1)' }, { name: 'pow()', complexity: 'O(1)' }, { name: 'ceil()', complexity: 'O(1)' }, { name: 'floor()', complexity: 'O(1)' }] },
      { class: '<numeric>', apis: [{ name: 'accumulate()', complexity: 'O(n)' }, { name: 'gcd()', complexity: 'O(log(min(a, b)))' }, { name: 'lcm()', complexity: 'O(log(min(a, b)))' }] }
    ],
    topPriority: ['Vector', 'String', 'Unordered Map', 'Unordered Set', 'Priority Queue', 'Deque', 'Stack / Queue', 'Set', 'Map']
  }
];

async function load() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('cheatsheet');
    
    // Clear existing
    await collection.deleteMany({});
    
    // Insert new data
    await collection.insertMany(cheatsheetData);
    
    console.log("Successfully inserted cheatsheet data into MongoDB!");
  } catch (err) {
    console.error("Error inserting data:", err);
  } finally {
    await client.close();
  }
}

load();
