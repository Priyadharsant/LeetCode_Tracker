const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'data', 'problems.json');

const videoMapping = {
  "Contains Duplicate": "3OamzN90kPg",
  "Valid Anagram": "9UtInBqnCgA",
  "Two Sum": "KLlXCFG5TnA",
  "Group Anagrams": "vzdNOKCGsz4",
  "Top K Frequent Elements": "YPTqKIzVkZa",
  "Encode and Decode Strings": "B1k_snOS4gw",
  "Product of Array Except Self": "bNvIQI2wAjk",
  "Valid Sudoku": "TjFXEUCMqI8",
  "Longest Consecutive Sequence": "P6RZZMu_maU",
  "Valid Palindrome": "jJXJ16kPFWg",
  "Two Sum II Input Array Is Sorted": "cQ1Oz4ckceM",
  "3Sum": "jzZsG8n2R9A",
  "Container With Most Water": "UuiTPhcgfjg",
  "Trapping Rain Water": "ZI2z5pq0TqA",
  "Best Time to Buy And Sell Stock": "1pkOgXD63yU",
  "Longest Substring Without Repeating Characters": "wiGpQwD31jM",
  "Longest Repeating Character Replacement": "gqXU1UyA8pk",
  "Minimum Window Substring": "jRmvsY5SgS2",
  "Sliding Window Maximum": "DfljaUwZsOk",
  "Valid Parentheses": "WTzjTskDFMg",
  "Min Stack": "qkLl7nAwDPo",
  "Evaluate Reverse Polish Notation": "iu0082c4HDE",
  "Generate Parentheses": "s9fokUqJf3A",
  "Daily Temperatures": "cTBiBSnjO3c",
  "Car Fleet": "Pr6T-3yB9RM",
  "Largest Rectangle In Histogram": "zx5Sw9130L0",
  "Binary Search": "s4DPM8ct1pI",
  "Search a 2D Matrix": "Ber2pi2C0j0",
  "Koko Eating Bananas": "U2SozAs9RzA",
  "Find Minimum In Rotated Sorted Array": "nIVW4P8b1VA",
  "Search In Rotated Sorted Array": "U8XENwh8Oy8",
  "Time Based Key Value Store": "fu2cD_6E8Hw",
  "Median of Two Sorted Arrays": "q6IEA26zGlQ",
  "Reverse Linked List": "G0_I-ZF0S38",
  "Merge Two Sorted Lists": "XIdigk956u0",
  "Reorder List": "S5bfdUTrKlM",
  "Remove Nth Node From End of List": "XVuQxGnc19h",
  "Copy List With Random Pointer": "5Y2EiZST97Y",
  "Add Two Numbers": "wgFbg7yX60P",
  "Linked List Cycle": "gBTe7lFR3vc",
  "Find The Duplicate Number": "wjYnzkAh752",
  "LRU Cache": "7ABFKPK2hD4",
  "Merge K Sorted Lists": "q5a5OiGbT6Q",
  "Reverse Nodes In K Group": "1UOPsfP85A4",
  "Invert Binary Tree": "OnSn2XEQ4MY",
  "Maximum Depth of Binary Tree": "hTM3phVI6YQ",
  "Diameter of Binary Tree": "bkxqA8RxH5e",
  "Balanced Binary Tree": "QfJsau0ItOY",
  "Same Tree": "vRbbcKXCxOw",
  "Subtree of Another Tree": "E36O5SWp-LE",
  "Lowest Common Ancestor of a Binary Search Tree": "gs2LMfuHd9C",
  "Binary Tree Level Order Traversal": "X71o9i1fE4s"
};

try {
  const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  let updatedCount = 0;

  for (let level of data) {
    if (level.problems && Array.isArray(level.problems)) {
      for (let problem of level.problems) {
        if (videoMapping[problem.name]) {
          problem.videoId = videoMapping[problem.name];
          updatedCount++;
        }
      }
    }
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully added ${updatedCount} video IDs to problems.json!`);
} catch (error) {
  console.error("Error updating problems.json:", error);
}
