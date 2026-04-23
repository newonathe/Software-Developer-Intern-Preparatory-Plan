(function () {
  const part1 = {
    id: "part1",
    label: "Part 1",
    title: "Foundations: start from zero, build real confidence",
    subtitle: "This first part assumes no prior coding experience. Every lesson only relies on ideas that were already introduced earlier on the page.",
    estimatedTime: "6-8 focused hours",
    examClockMinutes: 45,
    audience: "Absolute beginners, career switchers, and anyone who wants slower, clearer explanations before jumping into interview-style problems.",
    goals: [
      "Understand what code is doing line by line instead of memorizing syntax blindly.",
      "Practice Python and JavaScript in tiny, safe steps before solving full coding problems.",
      "Build enough confidence with variables, conditions, loops, strings, and functions to enter Part 2 without feeling lost."
    ],
    journey: [
      "Chapter 1: how programs run, variables, input, output, and reading code slowly",
      "Chapter 2: conditions, comparisons, loops, and tracing logic without panicking",
      "Chapter 3: functions, strings, arrays/lists, dictionaries/objects, and small reusable problem-solving patterns"
    ],
    chapters: [
      {
        id: "p1-c1",
        label: "Chapter 1",
        title: "Programs, variables, and readable output",
        duration: "70 min",
        unlock: "Assumes absolutely nothing. This is the first layer.",
        outcome: "You should be able to explain what each line does, store values in variables, and print useful output in Python and JavaScript.",
        sections: [
          {
            heading: "What a program really is",
            paragraphs: [
              "A program is just a sequence of instructions. The computer is not guessing your intention. It only follows the exact steps you give it, in order.",
              "When beginners feel overwhelmed, it is usually because they are trying to understand an entire file at once. A better habit is to read one line, ask what changed, then move to the next line.",
              "For IBM-style coding assessments, this matters because most problems are solved by turning a human process into small, mechanical steps."
            ],
            bullets: [
              "Input: the values the program receives",
              "Processing: the logic that changes, checks, or organizes those values",
              "Output: the final answer the program returns or prints"
            ],
            tip: "If you ever feel lost, pause and name the current input, the current goal, and the current output."
          },
          {
            heading: "Variables are labeled boxes",
            paragraphs: [
              "A variable is a name that points to a value. The name helps you remember what the value means in the story of the program.",
              "Good variable names reduce mistakes. A name like score or current_index gives you more help than x or temp unless the scope is extremely small."
            ],
            codeExamples: [
              {
                language: "python",
                title: "Python variables",
                code: "candidate_name = \"Ada\"\nattempt_number = 1\nready = True\nprint(candidate_name)\nprint(attempt_number)\nprint(ready)"
              },
              {
                language: "javascript",
                title: "JavaScript variables",
                code: "const candidateName = \"Ada\";\nlet attemptNumber = 1;\nconst ready = true;\nconsole.log(candidateName);\nconsole.log(attemptNumber);\nconsole.log(ready);"
              }
            ]
          },
          {
            heading: "Printing output helps you think",
            paragraphs: [
              "Printing is not just for final answers. It is one of the fastest ways to debug your thinking.",
              "When a program behaves unexpectedly, print the variable right before the suspicious line. That lets you verify whether the value is what you think it is."
            ],
            bullets: [
              "Print intermediate values while learning",
              "Use readable labels such as `print(\"current total:\", total)`",
              "Remove noisy debugging prints before final submission if the platform expects only one exact output"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Readable output with f-strings",
                code: "name = \"Mika\"\nscore = 92\nprint(f\"Candidate {name} earned {score} points.\")"
              },
              {
                language: "javascript",
                title: "Readable output with template literals",
                code: "const name = \"Mika\";\nconst score = 92;\nconsole.log(`Candidate ${name} earned ${score} points.`);"
              }
            ],
            tip: "When you can explain output clearly, you usually understand the data flow clearly too."
          }
        ],
        sandbox: {
          id: "p1-sandbox-1",
          title: "Experiment: edit values and re-run",
          description: "Change the name, attempt, and score. Run the code and observe how the printed output changes.",
          starterCode: {
            python: "name = \"Ada\"\nattempt = 1\nscore = 78\nprint(f\"Candidate {name} | attempt {attempt} | score {score}\")",
            javascript: "const name = \"Ada\";\nlet attempt = 1;\nconst score = 78;\nconsole.log(`Candidate ${name} | attempt ${attempt} | score ${score}`);"
          }
        },
        quiz: {
          id: "p1-quiz-1",
          title: "Checkpoint: reading code slowly",
          questions: [
            {
              prompt: "What is the main job of a variable in a beginner program?",
              choices: [
                "To repeat code automatically",
                "To store and label a value so it can be reused",
                "To prevent syntax errors forever",
                "To run code faster by default"
              ],
              answer: 1,
              explanation: "Variables give names to values. That lets your program reuse data and makes your code easier to read."
            },
            {
              prompt: "Why is printing intermediate values useful while learning?",
              choices: [
                "It lets you see what the program is doing between steps",
                "It guarantees the final answer is correct",
                "It removes the need for loops",
                "It makes every algorithm O(1)"
              ],
              answer: 0,
              explanation: "Printing helps you inspect the current state so you can catch incorrect assumptions earlier."
            },
            {
              prompt: "If a computer follows instructions exactly, what is the safest beginner habit?",
              choices: [
                "Guess what the code means from the file name",
                "Read every line as a small state change",
                "Memorize syntax without testing anything",
                "Use the shortest possible variable names"
              ],
              answer: 1,
              explanation: "Line-by-line tracing keeps your reasoning grounded in what the code actually does."
            }
          ]
        },
        challenge: {
          id: "p1-challenge-1",
          title: "Coding Practice: build a welcome message",
          difficulty: "Easy",
          description: "Write a function that returns the exact string `Candidate <name> - attempt <attempt>`.",
          instructions: [
            "Do not print the answer inside the function. Return it.",
            "Match spaces, capitalization, and punctuation exactly.",
            "This challenge is about variables, strings, and function returns."
          ],
          functionName: {
            python: "build_welcome_message",
            javascript: "buildWelcomeMessage"
          },
          starterCode: {
            python: "def build_welcome_message(name, attempt):\n    # Return: Candidate <name> - attempt <attempt>\n    pass",
            javascript: "function buildWelcomeMessage(name, attempt) {\n  // Return: Candidate <name> - attempt <attempt>\n}"
          },
          sampleTests: [
            { args: ["Ada", 1], expected: "Candidate Ada - attempt 1" },
            { args: ["Sam", 3], expected: "Candidate Sam - attempt 3" }
          ],
          hiddenTests: [
            { args: ["Chris", 10], expected: "Candidate Chris - attempt 10" },
            { args: ["zoe", 2], expected: "Candidate zoe - attempt 2" }
          ],
          complexity: { time: "O(1)", space: "O(1)" },
          explanation: [
            "This function does not need loops or conditions. It only combines the two inputs into one formatted string.",
            "Returning the string is important because most coding platforms grade the returned value, not what you print to the console."
          ],
          solution: {
            python: "def build_welcome_message(name, attempt):\n    return f\"Candidate {name} - attempt {attempt}\"",
            javascript: "function buildWelcomeMessage(name, attempt) {\n  return `Candidate ${name} - attempt ${attempt}`;\n}"
          },
          benchmark: {
            sizes: [1, 10, 100],
            buildInput(size) {
              return [`User${size}`, size];
            }
          }
        }
      },
      {
        id: "p1-c2",
        label: "Chapter 2",
        title: "Conditions, comparisons, and loops that stay readable",
        duration: "90 min",
        unlock: "Uses only the variable and output ideas from Chapter 1.",
        outcome: "You should be able to branch on conditions, repeat simple work with loops, and explain why a value changes during each iteration.",
        sections: [
          {
            heading: "Conditions let your code choose a path",
            paragraphs: [
              "Programs become useful when they can make decisions. Conditions answer questions such as 'Is this score passing?' or 'Did we already see this character?'",
              "The heart of a condition is a boolean result: true or false. If the condition is true, one block runs. If it is false, another block may run."
            ],
            bullets: [
              "Comparison operators: ==, !=, <, <=, >, >=",
              "Boolean connectors: and/or in Python, &&/|| in JavaScript",
              "Order matters in if / elif / else chains"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Python conditional",
                code: "score = 81\nif score >= 90:\n    print(\"Excellent\")\nelif score >= 70:\n    print(\"On track\")\nelse:\n    print(\"Needs more practice\")"
              },
              {
                language: "javascript",
                title: "JavaScript conditional",
                code: "const score = 81;\nif (score >= 90) {\n  console.log(\"Excellent\");\n} else if (score >= 70) {\n  console.log(\"On track\");\n} else {\n  console.log(\"Needs more practice\");\n}"
              }
            ]
          },
          {
            heading: "Loops repeat a small process",
            paragraphs: [
              "A loop is useful when you want to apply the same action to many values. Instead of rewriting code ten times, you write one loop that walks through the data.",
              "The key beginner question is not 'How do I memorize loop syntax?' The real question is 'What is changing each time, and when should the loop stop?'"
            ],
            bullets: [
              "Use `for` when you want to visit items in a sequence",
              "Use `while` when you want to continue until a condition becomes false",
              "Update your loop state carefully or you can create infinite loops"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Loop through scores",
                code: "scores = [40, 72, 88, 95]\npassing = 0\nfor score in scores:\n    if score >= 60:\n        passing += 1\nprint(passing)"
              },
              {
                language: "javascript",
                title: "Loop through scores",
                code: "const scores = [40, 72, 88, 95];\nlet passing = 0;\nfor (const score of scores) {\n  if (score >= 60) {\n    passing += 1;\n  }\n}\nconsole.log(passing);"
              }
            ],
            tip: "When tracing a loop, track the current item and the accumulator variable after each pass."
          },
          {
            heading: "Tracing is a superpower, not a backup plan",
            paragraphs: [
              "Many interview questions become much easier when you draw a tiny table with the current index, current value, and current answer after each step.",
              "If you cannot explain how your loop changes state, the computer cannot rescue you later. Slow tracing early saves a lot of debugging pain."
            ],
            bullets: [
              "Write the initial value of your answer variable before the loop starts",
              "For every iteration, note the item being processed and any condition result",
              "After the loop finishes, check whether the final answer variable really represents what the problem asked for"
            ]
          }
        ],
        sandbox: {
          id: "p1-sandbox-2",
          title: "Experiment: count passing scores",
          description: "Edit the scores list or array and watch how the final count changes. Try adding values below and above 60.",
          starterCode: {
            python: "scores = [55, 61, 72, 48, 90]\npassing = 0\nfor score in scores:\n    if score >= 60:\n        passing += 1\nprint(passing)",
            javascript: "const scores = [55, 61, 72, 48, 90];\nlet passing = 0;\nfor (const score of scores) {\n  if (score >= 60) {\n    passing += 1;\n  }\n}\nconsole.log(passing);"
          }
        },
        quiz: {
          id: "p1-quiz-2",
          title: "Checkpoint: conditions and loops",
          questions: [
            {
              prompt: "Why is the order of `if / elif / else` checks important?",
              choices: [
                "The computer always runs every branch anyway",
                "The first matching condition wins, so broad conditions can hide later ones",
                "It only matters in JavaScript",
                "Order affects time complexity but not correctness"
              ],
              answer: 1,
              explanation: "Once a matching branch is found, later branches are skipped. That means more specific checks often need to come first."
            },
            {
              prompt: "What is the main purpose of an accumulator such as `total` or `count` in a loop?",
              choices: [
                "To rename the loop itself",
                "To store the running answer as the loop processes items",
                "To prevent syntax errors",
                "To replace the need for conditions"
              ],
              answer: 1,
              explanation: "An accumulator keeps track of progress toward the final answer while the loop walks through the data."
            },
            {
              prompt: "What beginner question helps prevent infinite loops?",
              choices: [
                "What font am I using?",
                "Does the loop condition ever become false?",
                "Can I shorten the variable names?",
                "Should I avoid arrays forever?"
              ],
              answer: 1,
              explanation: "A loop must eventually stop. If your state never changes in a way that makes the condition false, the loop will keep running."
            }
          ]
        },
        challenge: {
          id: "p1-challenge-2",
          title: "Coding Practice: count passing scores",
          difficulty: "Easy",
          description: "Return how many numbers in the list or array are greater than or equal to 60.",
          instructions: [
            "Create a running counter.",
            "Loop through every score once.",
            "Return the final count."
          ],
          functionName: {
            python: "count_passing_scores",
            javascript: "countPassingScores"
          },
          starterCode: {
            python: "def count_passing_scores(scores):\n    count = 0\n    # your code here\n    return count",
            javascript: "function countPassingScores(scores) {\n  let count = 0;\n  // your code here\n  return count;\n}"
          },
          sampleTests: [
            { args: [[55, 60, 72, 49]], expected: 2 },
            { args: [[90, 88, 77]], expected: 3 }
          ],
          hiddenTests: [
            { args: [[0, 59, 60, 61, 100]], expected: 3 },
            { args: [[12, 21, 31]], expected: 0 }
          ],
          complexity: { time: "O(n)", space: "O(1)" },
          explanation: [
            "This is one of the first classic loop patterns: start with an answer variable, update it when a condition is met, return it at the end.",
            "A common beginner bug is returning inside the loop too early. Make sure the return happens after the loop has processed every score."
          ],
          solution: {
            python: "def count_passing_scores(scores):\n    count = 0\n    for score in scores:\n        if score >= 60:\n            count += 1\n    return count",
            javascript: "function countPassingScores(scores) {\n  let count = 0;\n  for (const score of scores) {\n    if (score >= 60) {\n      count += 1;\n    }\n  }\n  return count;\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              return [Array.from({ length: size }, (_, index) => index % 100)];
            }
          }
        }
      },
      {
        id: "p1-c3",
        label: "Chapter 3",
        title: "Functions, strings, arrays/lists, and lookup tables",
        duration: "110 min",
        unlock: "Uses the variable, condition, and loop ideas from Chapters 1 and 2.",
        outcome: "You should be able to package logic into a function, inspect characters in a string, and use lists or lookup tables to organize data cleanly.",
        sections: [
          {
            heading: "Functions package a repeatable job",
            paragraphs: [
              "A function is a named block of logic you can call later. It is useful whenever you want to describe a job once and reuse it.",
              "The most important beginner question is: what inputs does the function need, and what output should it return?"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Function with parameters and return",
                code: "def is_passing(score):\n    return score >= 60\n\nprint(is_passing(72))"
              },
              {
                language: "javascript",
                title: "Function with parameters and return",
                code: "function isPassing(score) {\n  return score >= 60;\n}\n\nconsole.log(isPassing(72));"
              }
            ],
            tip: "When you write the function name, imagine reading it like a sentence: `isPassing(score)` should tell you what the function gives back."
          },
          {
            heading: "Strings are sequences of characters",
            paragraphs: [
              "A string can be indexed one character at a time. That means many beginner problems are really just loops over text.",
              "You can count characters, compare characters, split text into pieces, or build a new result string as you go."
            ],
            bullets: [
              "Indexing lets you inspect one character at a time",
              "Lowercasing text often makes comparisons safer",
              "A loop over a string is conceptually the same as a loop over a list"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Count vowels in Python",
                code: "text = \"Assessment\"\nvowels = 0\nfor ch in text.lower():\n    if ch in \"aeiou\":\n        vowels += 1\nprint(vowels)"
              },
              {
                language: "javascript",
                title: "Count vowels in JavaScript",
                code: "const text = \"Assessment\";\nlet vowels = 0;\nfor (const ch of text.toLowerCase()) {\n  if (\"aeiou\".includes(ch)) {\n    vowels += 1;\n  }\n}\nconsole.log(vowels);"
              }
            ]
          },
          {
            heading: "Dictionaries and objects let you remember facts quickly",
            paragraphs: [
              "Lists are great when order matters. Dictionaries in Python and objects or maps in JavaScript are great when you want to look up information by a key.",
              "This becomes powerful the moment you need to count how often something appears. Instead of searching the whole list each time, you update a lookup table as you loop."
            ],
            bullets: [
              "Key: the thing you search by",
              "Value: the information stored for that key",
              "Counting pattern: if a key was not seen before, start it at 1; otherwise increment"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Character counting in Python",
                code: "counts = {}\nfor ch in \"ibm\":\n    counts[ch] = counts.get(ch, 0) + 1\nprint(counts)"
              },
              {
                language: "javascript",
                title: "Character counting in JavaScript",
                code: "const counts = {};\nfor (const ch of \"ibm\") {\n  counts[ch] = (counts[ch] || 0) + 1;\n}\nconsole.log(counts);"
              }
            ]
          }
        ],
        sandbox: {
          id: "p1-sandbox-3",
          title: "Experiment: count vowels in a word",
          description: "Try changing the string. Use uppercase, spaces, or repeated vowels and observe the result.",
          starterCode: {
            python: "text = \"assessment\"\nvowels = 0\nfor ch in text.lower():\n    if ch in \"aeiou\":\n        vowels += 1\nprint(vowels)",
            javascript: "const text = \"assessment\";\nlet vowels = 0;\nfor (const ch of text.toLowerCase()) {\n  if (\"aeiou\".includes(ch)) {\n    vowels += 1;\n  }\n}\nconsole.log(vowels);"
          }
        },
        quiz: {
          id: "p1-quiz-3",
          title: "Checkpoint: functions and data organization",
          questions: [
            {
              prompt: "What is the main purpose of a function return value?",
              choices: [
                "To send a result back to the place that called the function",
                "To stop all programs on the computer",
                "To create a loop automatically",
                "To rename a variable"
              ],
              answer: 0,
              explanation: "A return value is the function's answer. The calling code can then store it, print it, or use it in another calculation."
            },
            {
              prompt: "Why are dictionaries or objects helpful for counting?",
              choices: [
                "They remove the need for loops",
                "They let you store counts by key for fast lookup and update",
                "They sort every value automatically",
                "They only work with numbers"
              ],
              answer: 1,
              explanation: "Lookup tables make it easy to track how many times each item has appeared so far."
            },
            {
              prompt: "If a problem asks you to examine every character in a word, what is the simplest starting idea?",
              choices: [
                "Use a loop over the string",
                "Use binary search immediately",
                "Sort the string first every time",
                "Avoid functions"
              ],
              answer: 0,
              explanation: "Most beginner string tasks begin with a direct loop over the characters."
            }
          ]
        },
        challenge: {
          id: "p1-challenge-3",
          title: "Coding Practice: count vowels",
          difficulty: "Easy",
          description: "Return the number of vowels in a string. Treat uppercase and lowercase letters the same.",
          instructions: [
            "Loop through the text one character at a time.",
            "Convert the text to lowercase or compare against both cases.",
            "Return the final count."
          ],
          functionName: {
            python: "count_vowels",
            javascript: "countVowels"
          },
          starterCode: {
            python: "def count_vowels(text):\n    count = 0\n    # your code here\n    return count",
            javascript: "function countVowels(text) {\n  let count = 0;\n  // your code here\n  return count;\n}"
          },
          sampleTests: [
            { args: ["Assessment"], expected: 3 },
            { args: ["IBM"], expected: 1 }
          ],
          hiddenTests: [
            { args: ["queue"], expected: 4 },
            { args: ["rhythm"], expected: 0 }
          ],
          complexity: { time: "O(n)", space: "O(1)" },
          explanation: [
            "This is a classic string traversal problem. The loop visits each character once and updates a running count when it sees a vowel.",
            "Because you only keep one counter, the extra space stays constant."
          ],
          solution: {
            python: "def count_vowels(text):\n    count = 0\n    for ch in text.lower():\n        if ch in \"aeiou\":\n            count += 1\n    return count",
            javascript: "function countVowels(text) {\n  let count = 0;\n  for (const ch of text.toLowerCase()) {\n    if (\"aeiou\".includes(ch)) {\n      count += 1;\n    }\n  }\n  return count;\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              return ["aeiobcdfg".repeat(Math.max(1, Math.floor(size / 10)))];
            }
          }
        }
      }
    ],
    assessment: {
      id: "p1-assessment",
      title: "Part 1 readiness check",
      description: "This section combines the ideas from all three chapters. It stays beginner-friendly, but it expects you to reason without being guided one line at a time.",
      timerLabel: "Suggested timer: 25 minutes",
      questions: [
        {
          prompt: "Which plan is best when you are new and feel stuck on a problem?",
          choices: [
            "Start coding randomly and hope patterns appear",
            "Write down the input, the goal, and the tiny steps needed",
            "Skip tracing because it takes too long",
            "Avoid using variables until the end"
          ],
          answer: 1,
          explanation: "Grounding yourself in the input, goal, and step-by-step process prevents vague thinking."
        },
        {
          prompt: "What pattern best fits the job 'count how many values meet a condition'?",
          choices: [
            "Create an accumulator and update it inside a loop",
            "Sort everything first no matter what",
            "Use recursion immediately",
            "Avoid returning values"
          ],
          answer: 0,
          explanation: "An accumulator plus a loop is the basic counting pattern."
        },
        {
          prompt: "What makes a function easier to reuse?",
          choices: [
            "It relies on global variables only",
            "It has clear inputs and a clear returned output",
            "It prints at every line and never returns",
            "It is as long as possible"
          ],
          answer: 1,
          explanation: "Reusable functions have a clear contract: what comes in and what goes out."
        }
      ],
      codingChallenges: [
        {
          id: "p1-assessment-code",
          title: "Assessment Problem: summarize scores",
          difficulty: "Easy",
          description: "Return how many scores are passing and the total of all scores as a two-item array or list like `[passingCount, totalScore]`.",
          instructions: [
            "Use one loop.",
            "Track both the passing count and the running total.",
            "Return the two answers together."
          ],
          functionName: {
            python: "summarize_scores",
            javascript: "summarizeScores"
          },
          starterCode: {
            python: "def summarize_scores(scores):\n    passing_count = 0\n    total_score = 0\n    # your code here\n    return [passing_count, total_score]",
            javascript: "function summarizeScores(scores) {\n  let passingCount = 0;\n  let totalScore = 0;\n  // your code here\n  return [passingCount, totalScore];\n}"
          },
          sampleTests: [
            { args: [[55, 60, 70]], expected: [2, 185] }
          ],
          hiddenTests: [
            { args: [[100, 99]], expected: [2, 199] },
            { args: [[10, 20, 30]], expected: [0, 60] }
          ],
          complexity: { time: "O(n)", space: "O(1)" },
          explanation: [
            "This assessment problem checks whether you can maintain multiple accumulators in the same loop.",
            "That pattern appears often in coding tests because it avoids extra passes over the same data."
          ],
          solution: {
            python: "def summarize_scores(scores):\n    passing_count = 0\n    total_score = 0\n    for score in scores:\n        total_score += score\n        if score >= 60:\n            passing_count += 1\n    return [passing_count, total_score]",
            javascript: "function summarizeScores(scores) {\n  let passingCount = 0;\n  let totalScore = 0;\n  for (const score of scores) {\n    totalScore += score;\n    if (score >= 60) {\n      passingCount += 1;\n    }\n  }\n  return [passingCount, totalScore];\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              return [Array.from({ length: size }, (_, index) => (index * 7) % 101)];
            }
          }
        }
      ]
    },
    next: { href: "part2.html", label: "Continue to Part 2" }
  };

  const part2 = {
    id: "part2",
    label: "Part 2",
    title: "Advanced patterns: from comfortable to assessment-ready",
    subtitle: "This part assumes you understand the Part 1 foundations. Each subtopic starts from that base and adds one new layer at a time.",
    estimatedTime: "7-9 focused hours",
    examClockMinutes: 60,
    audience: "Learners who can already read simple code and now want the data structures, complexity awareness, and interview patterns that appear in coding assessments.",
    goals: [
      "Learn how to judge whether a solution is efficient enough before you submit it.",
      "Practice the core patterns that appear repeatedly in interview problems: hash maps, sets, stacks, binary search, and sliding windows.",
      "Move from simply getting an answer to getting a correct answer with good structure and solid reasoning."
    ],
    journey: [
      "Chapter 1: Big O, dry runs, and debugging habits that prevent wasted effort",
      "Chapter 2: hash maps, sets, and stack-style reasoning for faster lookups",
      "Chapter 3: binary search, two pointers, and sliding windows for medium-level assessment problems"
    ],
    chapters: [
      {
        id: "p2-c1",
        label: "Chapter 1",
        title: "Complexity, dry runs, and debugging before panic",
        duration: "95 min",
        unlock: "Assumes Part 1 loop and function knowledge.",
        outcome: "You should be able to estimate whether a solution is O(n), O(n²), or better, and you should know how to trace logic before rewriting everything.",
        sections: [
          {
            heading: "Big O is a language for growth, not a badge",
            paragraphs: [
              "Big O describes how the work grows as the input grows. It does not tell you the exact number of milliseconds. It tells you the shape of the cost.",
              "For coding assessments, you usually want to ask: does my solution scan once, scan twice, or scan inside another scan?"
            ],
            bullets: [
              "O(1): roughly constant work",
              "O(n): work grows in proportion to the input size",
              "O(n²): nested loops over the same input often land here",
              "A slower algorithm can still be correct, but it may fail hidden tests if the input is large"
            ],
            codeExamples: [
              {
                language: "python",
                title: "Single loop vs nested loop",
                code: "def count(nums):\n    total = 0\n    for num in nums:\n        total += num\n    return total\n\n\ndef pairs(nums):\n    out = []\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            out.append((nums[i], nums[j]))\n    return out"
              },
              {
                language: "javascript",
                title: "Single loop vs nested loop",
                code: "function count(nums) {\n  let total = 0;\n  for (const num of nums) {\n    total += num;\n  }\n  return total;\n}\n\nfunction pairs(nums) {\n  const out = [];\n  for (let i = 0; i < nums.length; i += 1) {\n    for (let j = 0; j < nums.length; j += 1) {\n      out.push([nums[i], nums[j]]);\n    }\n  }\n  return out;\n}"
              }
            ]
          },
          {
            heading: "Dry runs expose logic bugs early",
            paragraphs: [
              "A dry run means you simulate the algorithm on a small example by hand. This is one of the best ways to catch off-by-one mistakes, wrong loop bounds, and incorrect updates.",
              "When interview platforms feel stressful, dry runs are calming because they turn a vague idea into visible state changes."
            ],
            bullets: [
              "Pick a tiny example that still covers the tricky case",
              "Track the current index or pointer, current item, and current answer",
              "If the state table breaks, your code would have broken too"
            ],
            tip: "Debugging is much easier when you can name the first step where the state became wrong."
          },
          {
            heading: "Efficiency and correctness work together",
            paragraphs: [
              "A fast wrong answer is still wrong. A correct but extremely slow answer may also fail. Strong solutions care about both correctness and efficiency.",
              "Your first draft does not need to be perfect. It just needs to be clear enough that you can inspect and improve it."
            ]
          }
        ],
        sandbox: {
          id: "p2-sandbox-1",
          title: "Experiment: watch a nested loop grow",
          description: "Change the input size and compare the amount of work done by the simple loop and the nested loop.",
          starterCode: {
            python: "nums = [1, 2, 3, 4]\ncount = 0\nfor _ in nums:\n    count += 1\nprint(\"single loop work:\", count)\n\npair_count = 0\nfor _ in nums:\n    for _ in nums:\n        pair_count += 1\nprint(\"nested loop work:\", pair_count)",
            javascript: "const nums = [1, 2, 3, 4];\nlet count = 0;\nfor (const _ of nums) {\n  count += 1;\n}\nconsole.log(\"single loop work:\", count);\n\nlet pairCount = 0;\nfor (const _ of nums) {\n  for (const __ of nums) {\n    pairCount += 1;\n  }\n}\nconsole.log(\"nested loop work:\", pairCount);"
          }
        },
        quiz: {
          id: "p2-quiz-1",
          title: "Checkpoint: complexity habits",
          questions: [
            {
              prompt: "If you loop through the same array once and update a few variables, the usual time complexity is:",
              choices: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
              answer: 2,
              explanation: "One full pass over n items usually gives O(n) time."
            },
            {
              prompt: "What is the most useful purpose of a dry run before submitting?",
              choices: [
                "It guarantees the interviewer will like the style",
                "It helps you catch logic mistakes and state changes early",
                "It replaces the need for actual code",
                "It makes all loops O(1)"
              ],
              answer: 1,
              explanation: "Dry runs make invisible logic visible, which is especially useful for indexing and condition bugs."
            },
            {
              prompt: "Which statement is healthiest during a timed assessment?",
              choices: [
                "My first draft must already be perfect",
                "I should build a clear first solution and then improve it if needed",
                "Efficiency never matters if the answer is correct",
                "I should rewrite everything whenever I feel unsure"
              ],
              answer: 1,
              explanation: "A clear first draft gives you something real to debug and optimize."
            }
          ]
        },
        challenge: {
          id: "p2-challenge-1",
          title: "Coding Practice: first unique character",
          difficulty: "Easy-Medium",
          description: "Return the index of the first character that appears exactly once in the string. Return -1 if none exists.",
          instructions: [
            "Count how many times each character appears.",
            "Loop through the string again in order.",
            "Return the index of the first character whose count is 1."
          ],
          functionName: {
            python: "first_unique_char",
            javascript: "firstUniqueChar"
          },
          starterCode: {
            python: "def first_unique_char(text):\n    # return the index of the first unique character, or -1\n    pass",
            javascript: "function firstUniqueChar(text) {\n  // return the index of the first unique character, or -1\n}"
          },
          sampleTests: [
            { args: ["leetcode"], expected: 0 },
            { args: ["aabb"], expected: -1 }
          ],
          hiddenTests: [
            { args: ["loveleetcode"], expected: 2 },
            { args: ["z"], expected: 0 }
          ],
          complexity: { time: "O(n)", space: "O(n)" },
          explanation: [
            "This problem is a gentle introduction to using a lookup table for counts, then using a second pass to preserve the original order.",
            "Trying to check uniqueness by rescanning the whole string for every character would still work, but it would cost O(n²)."
          ],
          solution: {
            python: "def first_unique_char(text):\n    counts = {}\n    for ch in text:\n        counts[ch] = counts.get(ch, 0) + 1\n    for index, ch in enumerate(text):\n        if counts[ch] == 1:\n            return index\n    return -1",
            javascript: "function firstUniqueChar(text) {\n  const counts = {};\n  for (const ch of text) {\n    counts[ch] = (counts[ch] || 0) + 1;\n  }\n  for (let index = 0; index < text.length; index += 1) {\n    if (counts[text[index]] === 1) {\n      return index;\n    }\n  }\n  return -1;\n}"
          },
          benchmark: {
            sizes: [10, 100, 600],
            buildInput(size) {
              return [`a`.repeat(size - 1) + "b"];
            }
          }
        }
      },
      {
        id: "p2-c2",
        label: "Chapter 2",
        title: "Hash maps, sets, and stacks for faster reasoning",
        duration: "120 min",
        unlock: "Uses the Part 1 lookup-table idea and the Part 2 complexity mindset.",
        outcome: "You should know when a lookup table can replace repeated searching and when stack thinking fits a problem naturally.",
        sections: [
          {
            heading: "Hash maps turn repeated searches into direct lookups",
            paragraphs: [
              "If you keep asking 'Have I seen this before?' a hash map or set is often the right tool.",
              "Instead of scanning the whole list over and over, you store what you have seen so far and look it up directly."
            ],
            bullets: [
              "Use a map when you need to store related information by key",
              "Use a set when you only care whether something exists",
              "These structures often help turn O(n²) thinking into O(n)"
            ]
          },
          {
            heading: "Stacks help with 'most recent unfinished thing' problems",
            paragraphs: [
              "A stack follows last in, first out. The most recently added item is the first one removed.",
              "That makes stacks useful for parentheses validation, undo features, path backtracking, and other nesting problems."
            ],
            codeExamples: [
              {
                language: "python",
                title: "Basic stack idea",
                code: "stack = []\nstack.append(\"(\")\nlast = stack.pop()\nprint(last)"
              },
              {
                language: "javascript",
                title: "Basic stack idea",
                code: "const stack = [];\nstack.push(\"(\");\nconst last = stack.pop();\nconsole.log(last);"
              }
            ],
            tip: "If the problem sounds like opening and closing, entering and leaving, or starting and finishing nested work, try stack thinking."
          },
          {
            heading: "Choosing the right structure reduces stress",
            paragraphs: [
              "Interview problems often feel harder than they are because the wrong data structure makes every step awkward.",
              "When the data structure matches the job, the code becomes shorter, clearer, and faster."
            ]
          }
        ],
        sandbox: {
          id: "p2-sandbox-2",
          title: "Experiment: seen set pattern",
          description: "Try adding duplicate values and observe when the message changes.",
          starterCode: {
            python: "nums = [1, 2, 3, 2]\nseen = set()\nfor num in nums:\n    if num in seen:\n        print(\"duplicate found:\", num)\n        break\n    seen.add(num)",
            javascript: "const nums = [1, 2, 3, 2];\nconst seen = new Set();\nfor (const num of nums) {\n  if (seen.has(num)) {\n    console.log(\"duplicate found:\", num);\n    break;\n  }\n  seen.add(num);\n}"
          }
        },
        quiz: {
          id: "p2-quiz-2",
          title: "Checkpoint: choosing structures",
          questions: [
            {
              prompt: "If you need to know quickly whether a value has already appeared, which structure is often best?",
              choices: ["Set", "Queue only", "Nested loop", "String interpolation"],
              answer: 0,
              explanation: "A set is ideal when existence checks are the main job."
            },
            {
              prompt: "What type of problem often suggests a stack?",
              choices: [
                "Finding the average of numbers",
                "Nested opening and closing symbols",
                "Printing a fixed sentence",
                "Sorting alphabetically by default"
              ],
              answer: 1,
              explanation: "Matching nested open and close symbols is a classic stack use case."
            },
            {
              prompt: "Why can a hash map improve performance?",
              choices: [
                "It removes the need for conditions",
                "It stores values for direct lookup instead of repeated scanning",
                "It only works for strings",
                "It guarantees O(1) for every possible operation in every real situation"
              ],
              answer: 1,
              explanation: "The big win is replacing repeated searching with quick lookups by key."
            }
          ]
        },
        challenge: {
          id: "p2-challenge-2",
          title: "Coding Practice: valid parentheses",
          difficulty: "Medium",
          description: "Return true if every opening bracket is closed in the correct order. The string contains only `()[]{}` characters.",
          instructions: [
            "Use a stack.",
            "Push opening brackets.",
            "When you see a closing bracket, it must match the most recent opening bracket."
          ],
          functionName: {
            python: "is_valid_parentheses",
            javascript: "isValidParentheses"
          },
          starterCode: {
            python: "def is_valid_parentheses(text):\n    # return True or False\n    pass",
            javascript: "function isValidParentheses(text) {\n  // return true or false\n}"
          },
          sampleTests: [
            { args: ["()[]{}"], expected: true },
            { args: ["(]"], expected: false }
          ],
          hiddenTests: [
            { args: ["([{}])"], expected: true },
            { args: ["(()"], expected: false }
          ],
          complexity: { time: "O(n)", space: "O(n)" },
          explanation: [
            "A stack fits because each closing bracket must match the most recent unmatched opening bracket.",
            "The final stack must be empty. If anything is left, some opening bracket was never closed."
          ],
          solution: {
            python: "def is_valid_parentheses(text):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for ch in text:\n        if ch in '([{':\n            stack.append(ch)\n        else:\n            if not stack or stack[-1] != pairs[ch]:\n                return False\n            stack.pop()\n    return len(stack) == 0",
            javascript: "function isValidParentheses(text) {\n  const pairs = { ')': '(', ']': '[', '}': '{' };\n  const stack = [];\n  for (const ch of text) {\n    if (ch === '(' || ch === '[' || ch === '{') {\n      stack.push(ch);\n    } else {\n      if (!stack.length || stack[stack.length - 1] !== pairs[ch]) {\n        return false;\n      }\n      stack.pop();\n    }\n  }\n  return stack.length === 0;\n}"
          },
          benchmark: {
            sizes: [10, 100, 500],
            buildInput(size) {
              return ["()".repeat(Math.max(1, Math.floor(size / 2)))];
            }
          }
        }
      },
      {
        id: "p2-c3",
        label: "Chapter 3",
        title: "Binary search, two pointers, and sliding windows",
        duration: "135 min",
        unlock: "Uses the control flow, loops, lookup tables, and efficiency awareness from all earlier chapters.",
        outcome: "You should recognize a few core problem shapes instead of approaching every medium problem from scratch.",
        sections: [
          {
            heading: "Binary search works on already sorted data",
            paragraphs: [
              "Binary search repeatedly cuts the search space in half. That makes it far faster than scanning every element when the data is sorted.",
              "Its core question is: based on the middle value, which half can I safely discard?"
            ],
            bullets: [
              "Keep a left and right boundary",
              "Compute the middle index",
              "Move left or right depending on the comparison"
            ]
          },
          {
            heading: "Two pointers and sliding windows reduce repeated work",
            paragraphs: [
              "Two pointers are helpful when you have a range, pair, or moving boundary in an array or string.",
              "A sliding window is a controlled moving range. Instead of rebuilding information from scratch each time, you update the current window as it grows or shrinks."
            ],
            bullets: [
              "Use two pointers when both ends move based on a condition",
              "Use a sliding window when you need a best subarray or substring that changes over time",
              "These patterns often convert nested-loop ideas into linear-time solutions"
            ],
            tip: "If your first idea keeps rescanning the same region, ask whether a moving window could carry the needed state forward."
          },
          {
            heading: "Pattern recognition should stay logical, not magical",
            paragraphs: [
              "The goal is not to memorize dozens of templates. The goal is to notice the shape of the work: sorted search, matching pairs, growing and shrinking windows, seen-so-far tracking.",
              "That is why this portal keeps connecting new patterns back to earlier ideas. Advanced techniques are still built from variables, loops, conditions, and careful state updates."
            ]
          }
        ],
        sandbox: {
          id: "p2-sandbox-3",
          title: "Experiment: binary search boundaries",
          description: "Change the target and sorted array, then observe how left, right, and middle shrink the search space.",
          starterCode: {
            python: "nums = [1, 3, 5, 7, 9]\ntarget = 7\nleft = 0\nright = len(nums) - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    print(\"left\", left, \"mid\", mid, \"right\", right, \"value\", nums[mid])\n    if nums[mid] == target:\n        print(\"found\")\n        break\n    if nums[mid] < target:\n        left = mid + 1\n    else:\n        right = mid - 1",
            javascript: "const nums = [1, 3, 5, 7, 9];\nconst target = 7;\nlet left = 0;\nlet right = nums.length - 1;\nwhile (left <= right) {\n  const mid = Math.floor((left + right) / 2);\n  console.log(\"left\", left, \"mid\", mid, \"right\", right, \"value\", nums[mid]);\n  if (nums[mid] === target) {\n    console.log(\"found\");\n    break;\n  }\n  if (nums[mid] < target) {\n    left = mid + 1;\n  } else {\n    right = mid - 1;\n  }\n}"
          }
        },
        quiz: {
          id: "p2-quiz-3",
          title: "Checkpoint: pattern recognition",
          questions: [
            {
              prompt: "What condition is required before binary search makes sense?",
              choices: [
                "The data must already be sorted or ordered in a compatible way",
                "The data must have only positive numbers",
                "The answer must be at the center",
                "The input must be a string"
              ],
              answer: 0,
              explanation: "Binary search relies on order. Without order, you cannot safely discard half the data."
            },
            {
              prompt: "Why can a sliding window beat repeated rescanning?",
              choices: [
                "It stores the state of the current window and updates it incrementally",
                "It always uses recursion",
                "It avoids using variables",
                "It sorts the input automatically"
              ],
              answer: 0,
              explanation: "The advantage is carrying forward useful information instead of rebuilding from scratch."
            },
            {
              prompt: "What is the main mindset behind pattern recognition?",
              choices: [
                "Memorize dozens of answers without understanding",
                "Notice recurring problem shapes and map them to suitable state changes",
                "Avoid beginner concepts once you learn advanced ones",
                "Use the most complicated algorithm first"
              ],
              answer: 1,
              explanation: "Good pattern recognition still rests on understanding state, loops, and conditions."
            }
          ]
        },
        challenge: {
          id: "p2-challenge-3",
          title: "Coding Practice: binary search",
          difficulty: "Medium",
          description: "Given a sorted list or array and a target value, return the index of the target or -1 if it is not present.",
          instructions: [
            "Use left and right boundaries.",
            "Inspect the middle value each time.",
            "Discard the half that cannot contain the answer."
          ],
          functionName: {
            python: "binary_search",
            javascript: "binarySearch"
          },
          starterCode: {
            python: "def binary_search(nums, target):\n    left = 0\n    right = len(nums) - 1\n    # your code here\n    return -1",
            javascript: "function binarySearch(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  // your code here\n  return -1;\n}"
          },
          sampleTests: [
            { args: [[1, 3, 5, 7, 9], 7], expected: 3 },
            { args: [[2, 4, 6, 8], 5], expected: -1 }
          ],
          hiddenTests: [
            { args: [[1], 1], expected: 0 },
            { args: [[1, 2, 3, 4, 5, 6], 6], expected: 5 }
          ],
          complexity: { time: "O(log n)", space: "O(1)" },
          explanation: [
            "Binary search cuts the remaining search space in half each iteration. That gives logarithmic time.",
            "A common bug is forgetting to move the boundaries by one step, which can trap the loop on the same middle index."
          ],
          solution: {
            python: "def binary_search(nums, target):\n    left = 0\n    right = len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
            javascript: "function binarySearch(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) {\n      return mid;\n    }\n    if (nums[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid - 1;\n    }\n  }\n  return -1;\n}"
          },
          benchmark: {
            sizes: [16, 256, 4096],
            buildInput(size) {
              const nums = Array.from({ length: size }, (_, index) => index * 2);
              return [nums, nums[nums.length - 1]];
            }
          }
        }
      }
    ],
    assessment: {
      id: "p2-assessment",
      title: "Part 2 readiness check",
      description: "This checkpoint expects you to combine efficient data structures and clearer pattern selection.",
      timerLabel: "Suggested timer: 35 minutes",
      questions: [
        {
          prompt: "What is the usual advantage of replacing repeated scans with a hash map or set?",
          choices: [
            "It removes the need to loop at all",
            "It can reduce repeated work by supporting direct lookups",
            "It always lowers space usage to O(1)",
            "It guarantees the answer is sorted"
          ],
          answer: 1,
          explanation: "The main win is faster lookup, which often reduces overall time complexity."
        },
        {
          prompt: "If your data is sorted and you need to find one target efficiently, what pattern should you consider first?",
          choices: ["Binary search", "Stack", "Breadth-first search", "Recursion by default"],
          answer: 0,
          explanation: "Sorted search problems are a strong signal for binary search."
        },
        {
          prompt: "Why is O(n²) often risky on hidden tests?",
          choices: [
            "Because nested repeated work can grow too quickly on large inputs",
            "Because it is always logically incorrect",
            "Because it uses no variables",
            "Because it cannot be written in Python"
          ],
          answer: 0,
          explanation: "Quadratic work can become too slow once input sizes grow."
        }
      ],
      codingChallenges: [
        {
          id: "p2-assessment-code",
          title: "Assessment Problem: two-sum indices",
          difficulty: "Medium",
          description: "Return the two indices of numbers that add up to the target. You may assume exactly one valid pair exists.",
          instructions: [
            "Use a hash map to remember values you have already seen.",
            "For each value, compute the complement needed.",
            "Return the earlier index and the current index as soon as the pair is found."
          ],
          functionName: {
            python: "two_sum_indices",
            javascript: "twoSumIndices"
          },
          starterCode: {
            python: "def two_sum_indices(nums, target):\n    seen = {}\n    # your code here",
            javascript: "function twoSumIndices(nums, target) {\n  const seen = {};\n  // your code here\n}"
          },
          sampleTests: [
            { args: [[2, 7, 11, 15], 9], expected: [0, 1] }
          ],
          hiddenTests: [
            { args: [[3, 2, 4], 6], expected: [1, 2] },
            { args: [[3, 3], 6], expected: [0, 1] }
          ],
          complexity: { time: "O(n)", space: "O(n)" },
          explanation: [
            "The map stores value -> index for items already seen. That lets each new number check instantly whether its partner already appeared.",
            "This is a classic example of using extra space to avoid an O(n²) nested-loop solution."
          ],
          solution: {
            python: "def two_sum_indices(nums, target):\n    seen = {}\n    for index, num in enumerate(nums):\n        need = target - num\n        if need in seen:\n            return [seen[need], index]\n        seen[num] = index",
            javascript: "function twoSumIndices(nums, target) {\n  const seen = {};\n  for (let index = 0; index < nums.length; index += 1) {\n    const num = nums[index];\n    const need = target - num;\n    if (Object.prototype.hasOwnProperty.call(seen, need)) {\n      return [seen[need], index];\n    }\n    seen[num] = index;\n  }\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              const nums = Array.from({ length: size }, (_, index) => index + 1);
              return [nums, nums[0] + nums[nums.length - 1]];
            }
          }
        }
      ]
    },
    previous: { href: "index.html", label: "Back to Part 1" },
    next: { href: "part3.html", label: "Continue to Part 3" }
  };

  const part3 = {
    id: "part3",
    label: "Part 3",
    title: "Full coding assessment simulation",
    subtitle: "This part applies everything from Parts 1 and 2. The problems are split into Easy, Medium, and Hard so you can practice pacing, correctness, and efficiency together.",
    estimatedTime: "90 min assessment + review",
    examClockMinutes: 90,
    audience: "Learners who want a realistic assessment flow with hidden tests, performance feedback, and solution explanations after submission.",
    goals: [
      "Simulate assessment pacing without exposing answers upfront.",
      "Test correctness on hidden cases, not just the visible examples.",
      "Review explanations after submission so mistakes become study material instead of dead ends."
    ],
    journey: [
      "Easy: clean loops, conditions, and string handling under time pressure",
      "Medium: hash-map reasoning and correct state tracking",
      "Hard: sliding-window thinking with efficiency pressure"
    ],
    chapters: [],
    assessment: {
      id: "p3-assessment",
      title: "Timed practice assessment",
      description: "Run the sample tests while you work. Hidden tests, explanations, reference solutions, and efficiency notes appear only after you submit each challenge.",
      timerLabel: "Suggested timer: 90 minutes",
      questions: [],
      codingChallenges: [
        {
          id: "p3-easy",
          title: "Easy: count long names",
          difficulty: "Easy",
          description: "Given an array or list of names and a minimum length, return how many names have length greater than or equal to that minimum.",
          instructions: [
            "Loop once through the names.",
            "Use the length of each name.",
            "Return the count."
          ],
          functionName: {
            python: "count_long_names",
            javascript: "countLongNames"
          },
          starterCode: {
            python: "def count_long_names(names, min_length):\n    count = 0\n    # your code here\n    return count",
            javascript: "function countLongNames(names, minLength) {\n  let count = 0;\n  // your code here\n  return count;\n}"
          },
          sampleTests: [
            { args: [["Ada", "Mika", "Jo"], 3], expected: 2 }
          ],
          hiddenTests: [
            { args: [["Ann", "Bo", "Chris", "Dee"], 4], expected: 1 },
            { args: [["IBM", "Code"], 3], expected: 2 }
          ],
          complexity: { time: "O(n)", space: "O(1)" },
          explanation: [
            "The solution is a direct count-with-condition loop. In a real assessment, this is the kind of problem you want to solve cleanly and quickly to build momentum.",
            "Return the final count only after the loop finishes."
          ],
          solution: {
            python: "def count_long_names(names, min_length):\n    count = 0\n    for name in names:\n        if len(name) >= min_length:\n            count += 1\n    return count",
            javascript: "function countLongNames(names, minLength) {\n  let count = 0;\n  for (const name of names) {\n    if (name.length >= minLength) {\n      count += 1;\n    }\n  }\n  return count;\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              return [Array.from({ length: size }, (_, index) => `name${index}`), 5];
            }
          }
        },
        {
          id: "p3-medium",
          title: "Medium: find pair indices",
          difficulty: "Medium",
          description: "Return the indices of the two values that add up to the target. Assume exactly one valid answer exists.",
          instructions: [
            "Track seen values in a lookup table.",
            "For each number, compute the complement you need.",
            "Return the two indices as soon as you find the pair."
          ],
          functionName: {
            python: "find_pair_indices",
            javascript: "findPairIndices"
          },
          starterCode: {
            python: "def find_pair_indices(nums, target):\n    seen = {}\n    # your code here",
            javascript: "function findPairIndices(nums, target) {\n  const seen = {};\n  // your code here\n}"
          },
          sampleTests: [
            { args: [[4, 7, 1, 9], 10], expected: [2, 3] }
          ],
          hiddenTests: [
            { args: [[2, 11, 15, 7], 9], expected: [0, 3] },
            { args: [[5, 5], 10], expected: [0, 1] }
          ],
          complexity: { time: "O(n)", space: "O(n)" },
          explanation: [
            "This is the same core reasoning as Two Sum. The hidden tests check whether you really understand the seen-so-far pattern instead of only matching the sample layout.",
            "A nested-loop answer might pass small cases but would be slower than needed on large inputs."
          ],
          solution: {
            python: "def find_pair_indices(nums, target):\n    seen = {}\n    for index, num in enumerate(nums):\n        need = target - num\n        if need in seen:\n            return [seen[need], index]\n        seen[num] = index",
            javascript: "function findPairIndices(nums, target) {\n  const seen = {};\n  for (let index = 0; index < nums.length; index += 1) {\n    const num = nums[index];\n    const need = target - num;\n    if (Object.prototype.hasOwnProperty.call(seen, need)) {\n      return [seen[need], index];\n    }\n    seen[num] = index;\n  }\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              const nums = Array.from({ length: size }, (_, index) => index + 1);
              return [nums, nums[0] + nums[nums.length - 1]];
            }
          }
        },
        {
          id: "p3-hard",
          title: "Hard: longest unique substring length",
          difficulty: "Hard",
          description: "Return the length of the longest substring that contains no repeated characters.",
          instructions: [
            "Use a sliding window.",
            "Track the most recent position of each character.",
            "When you see a repeated character inside the current window, move the left boundary forward."
          ],
          functionName: {
            python: "longest_unique_substring_length",
            javascript: "longestUniqueSubstringLength"
          },
          starterCode: {
            python: "def longest_unique_substring_length(text):\n    left = 0\n    best = 0\n    last_seen = {}\n    # your code here\n    return best",
            javascript: "function longestUniqueSubstringLength(text) {\n  let left = 0;\n  let best = 0;\n  const lastSeen = {};\n  // your code here\n  return best;\n}"
          },
          sampleTests: [
            { args: ["abcabcbb"], expected: 3 }
          ],
          hiddenTests: [
            { args: ["bbbbb"], expected: 1 },
            { args: ["pwwkew"], expected: 3 },
            { args: ["dvdf"], expected: 3 }
          ],
          complexity: { time: "O(n)", space: "O(n)" },
          explanation: [
            "The sliding window keeps a valid substring with no duplicates. The left pointer only moves forward, so the full algorithm stays linear.",
            "A common bug is moving `left` backward when you see an old duplicate. Use the maximum of the current left boundary and the next position after the previous occurrence."
          ],
          solution: {
            python: "def longest_unique_substring_length(text):\n    left = 0\n    best = 0\n    last_seen = {}\n    for right, ch in enumerate(text):\n        if ch in last_seen and last_seen[ch] >= left:\n            left = last_seen[ch] + 1\n        last_seen[ch] = right\n        best = max(best, right - left + 1)\n    return best",
            javascript: "function longestUniqueSubstringLength(text) {\n  let left = 0;\n  let best = 0;\n  const lastSeen = {};\n  for (let right = 0; right < text.length; right += 1) {\n    const ch = text[right];\n    if (Object.prototype.hasOwnProperty.call(lastSeen, ch) && lastSeen[ch] >= left) {\n      left = lastSeen[ch] + 1;\n    }\n    lastSeen[ch] = right;\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}"
          },
          benchmark: {
            sizes: [12, 120, 1200],
            buildInput(size) {
              const alphabet = "abcdefghijklmnopqrstuvwxyz";
              let text = "";
              for (let index = 0; index < size; index += 1) {
                text += alphabet[index % alphabet.length];
              }
              return [text];
            }
          }
        }
      ]
    },
    previous: { href: "part2.html", label: "Back to Part 2" },
    next: { href: "part4.html", label: "Continue to Part 4" }
  };

  const part4 = {
    id: "part4",
    label: "Part 4",
    title: "Progression topics: grow beyond the assessment",
    subtitle: "This part assumes you completed or at least understood the first three parts. It is about converting assessment skill into broader software engineering skill.",
    estimatedTime: "Open-ended study path",
    examClockMinutes: 40,
    audience: "Learners who want the next layer after coding-assessment preparation: cleaner code, testing, APIs, SQL, and project-building habits.",
    goals: [
      "Turn problem-solving skill into real project skill.",
      "Learn how experienced developers make code safer, easier to change, and easier to trust.",
      "Build a practical progression plan instead of stopping after one assessment."
    ],
    journey: [
      "Chapter 1: clean code, modular thinking, and beginner-friendly object-oriented design",
      "Chapter 2: testing, debugging workflows, and confidence-building engineering habits",
      "Chapter 3: files, JSON, APIs, and data pipelines you will meet in real work",
      "Chapter 4: SQL, portfolio projects, and what to study next"
    ],
    chapters: [
      {
        id: "p4-c1",
        label: "Chapter 1",
        title: "Clean code and modular design",
        duration: "80 min",
        unlock: "Built on the function design habits from earlier parts.",
        outcome: "You should see how naming, decomposition, and small modules make code easier to read and maintain.",
        sections: [
          {
            heading: "Readable code is a gift to your future self",
            paragraphs: [
              "In interviews, clean code helps you explain your thinking. In projects, it helps you come back later without starting from zero.",
              "Clean code is not about sounding advanced. It is about reducing unnecessary mental load."
            ],
            bullets: [
              "Choose names that reveal purpose",
              "Break long logic into focused helper functions",
              "Keep one function responsible for one clear job"
            ]
          },
          {
            heading: "Object-oriented design can start small",
            paragraphs: [
              "You do not need a huge architecture to benefit from OOP ideas. A small class can simply bundle related data and behavior together.",
              "For beginners, the real value is clarity: if a Student object knows how to compute its own average, your program can read more naturally."
            ],
            codeExamples: [
              {
                language: "python",
                title: "Simple Python class",
                code: "class Candidate:\n    def __init__(self, name, scores):\n        self.name = name\n        self.scores = scores\n\n    def average_score(self):\n        return sum(self.scores) / len(self.scores)"
              },
              {
                language: "javascript",
                title: "Simple JavaScript class",
                code: "class Candidate {\n  constructor(name, scores) {\n    this.name = name;\n    this.scores = scores;\n  }\n\n  averageScore() {\n    return this.scores.reduce((sum, score) => sum + score, 0) / this.scores.length;\n  }\n}"
              }
            ],
            tip: "If OOP feels abstract, think of a class as a reusable template for related state and behavior."
          }
        ],
        sandbox: {
          id: "p4-sandbox-1",
          title: "Experiment: refactor into a helper",
          description: "Edit the helper function or class method and see how the rest of the code becomes easier to read.",
          starterCode: {
            python: "def average(scores):\n    return sum(scores) / len(scores)\n\ncandidate_scores = [90, 85, 95]\nprint(average(candidate_scores))",
            javascript: "function average(scores) {\n  return scores.reduce((sum, score) => sum + score, 0) / scores.length;\n}\n\nconst candidateScores = [90, 85, 95];\nconsole.log(average(candidateScores));"
          }
        },
        quiz: {
          id: "p4-quiz-1",
          title: "Checkpoint: clean code mindset",
          questions: [
            {
              prompt: "What is the main benefit of meaningful names?",
              choices: [
                "They make code easier to understand without rereading every line",
                "They automatically optimize runtime",
                "They remove the need for comments forever",
                "They only matter in Python"
              ],
              answer: 0,
              explanation: "Meaningful names reduce the amount of translation your brain has to do while reading."
            },
            {
              prompt: "Why might you split a long function into helpers?",
              choices: [
                "To make the program impossible to follow",
                "To separate responsibilities and reduce mental load",
                "Because interviews forbid long functions",
                "Because helpers always run faster"
              ],
              answer: 1,
              explanation: "Helpers can make the codebase easier to navigate and test."
            }
          ]
        },
        challenge: {
          id: "p4-challenge-1",
          title: "Coding Practice: candidate average",
          difficulty: "Medium",
          description: "Return the integer floor of the average of a non-empty score list or array.",
          instructions: [
            "Use a running total or built-in sum/reduce.",
            "Divide by the number of scores.",
            "Return the floored integer result."
          ],
          functionName: {
            python: "candidate_average",
            javascript: "candidateAverage"
          },
          starterCode: {
            python: "def candidate_average(scores):\n    # return the floored average\n    pass",
            javascript: "function candidateAverage(scores) {\n  // return the floored average\n}"
          },
          sampleTests: [
            { args: [[90, 80, 70]], expected: 80 }
          ],
          hiddenTests: [
            { args: [[100, 99]], expected: 99 },
            { args: [[61, 62, 63]], expected: 62 }
          ],
          complexity: { time: "O(n)", space: "O(1)" },
          explanation: [
            "This looks simple, but it reinforces the habit of writing clear helper logic that can be reused across a larger program.",
            "In a real project, this would be a small function or method that hides a common calculation."
          ],
          solution: {
            python: "def candidate_average(scores):\n    return sum(scores) // len(scores)",
            javascript: "function candidateAverage(scores) {\n  const total = scores.reduce((sum, score) => sum + score, 0);\n  return Math.floor(total / scores.length);\n}"
          },
          benchmark: {
            sizes: [10, 100, 1000],
            buildInput(size) {
              return [Array.from({ length: size }, (_, index) => 50 + (index % 51))];
            }
          }
        }
      },
      {
        id: "p4-c2",
        label: "Chapter 2",
        title: "Testing and debugging as daily habits",
        duration: "90 min",
        unlock: "Built on tracing and assessment review from earlier parts.",
        outcome: "You should know how to design small tests, isolate bugs, and build confidence in code instead of relying on hope.",
        sections: [
          {
            heading: "Testing means choosing representative examples",
            paragraphs: [
              "A good test set usually includes a normal case, an edge case, and a tricky case that could expose a common bug.",
              "In coding assessments, sample tests are not enough. Hidden tests often target empty inputs, duplicates, negative numbers, or boundary positions."
            ],
            bullets: [
              "Normal case: checks the typical path",
              "Edge case: checks a boundary like size 0, size 1, or repeated values",
              "Tricky case: checks the bug you are most likely to make"
            ]
          },
          {
            heading: "Debugging is controlled investigation",
            paragraphs: [
              "When a program fails, the goal is not to feel bad. The goal is to locate the first state that became wrong and ask why.",
              "Printing, logging, and small targeted tests are all part of a healthy debugging workflow."
            ],
            tip: "Instead of asking 'Why is my whole program broken?', ask 'What was the first value that was not what I expected?'"
          }
        ],
        sandbox: {
          id: "p4-sandbox-2",
          title: "Experiment: write your own mini test set",
          description: "Change the test cases and watch how quickly a bad assumption gets exposed.",
          starterCode: {
            python: "def is_even(num):\n    return num % 2 == 0\n\nfor value in [0, 1, 2, 11, 42]:\n    print(value, is_even(value))",
            javascript: "function isEven(num) {\n  return num % 2 === 0;\n}\n\nfor (const value of [0, 1, 2, 11, 42]) {\n  console.log(value, isEven(value));\n}"
          }
        },
        quiz: {
          id: "p4-quiz-2",
          title: "Checkpoint: testing workflow",
          questions: [
            {
              prompt: "What is the value of an edge case?",
              choices: [
                "It checks a boundary where bugs often hide",
                "It is always the largest possible input",
                "It replaces the normal case",
                "It only matters for recursion"
              ],
              answer: 0,
              explanation: "Boundary conditions are common bug sources, so testing them is extremely valuable."
            },
            {
              prompt: "What is a productive debugging question?",
              choices: [
                "Why am I bad at programming?",
                "At what exact step did the program state first become wrong?",
                "Should I delete the whole file now?",
                "Can I avoid testing this forever?"
              ],
              answer: 1,
              explanation: "Specific, state-based questions lead to specific fixes."
            }
          ]
        }
      },
      {
        id: "p4-c3",
        label: "Chapter 3",
        title: "Files, JSON, APIs, and useful data workflows",
        duration: "105 min",
        unlock: "Built on earlier work with strings, dictionaries, and structured data.",
        outcome: "You should understand how application code often receives data from files or APIs and turns it into structured program logic.",
        sections: [
          {
            heading: "Real software usually reads structured data",
            paragraphs: [
              "Outside coding assessments, many tasks involve reading files, processing JSON, or calling an API endpoint and interpreting the response.",
              "That is why strings, lists, and dictionaries matter so much. They are the everyday building blocks of data handling."
            ],
            bullets: [
              "Files give your program stored input",
              "JSON is a common text format for structured data",
              "APIs let one program request data or actions from another program"
            ]
          },
          {
            heading: "The same problem-solving habits still apply",
            paragraphs: [
              "Even when the input comes from an API, you still ask the same questions: what data came in, what structure is it in, what output do I need, and what transformations happen in between?",
              "Projects feel bigger than coding assessments, but the mental process is still built from the same fundamentals."
            ]
          }
        ],
        sandbox: {
          id: "p4-sandbox-3",
          title: "Experiment: structured JSON-like data",
          description: "Edit the candidate objects and see how the lookup logic changes.",
          starterCode: {
            python: "candidates = [\n    {\"name\": \"Ada\", \"score\": 90},\n    {\"name\": \"Sam\", \"score\": 78}\n]\nfor candidate in candidates:\n    print(candidate[\"name\"], candidate[\"score\"])",
            javascript: "const candidates = [\n  { name: \"Ada\", score: 90 },\n  { name: \"Sam\", score: 78 }\n];\nfor (const candidate of candidates) {\n  console.log(candidate.name, candidate.score);\n}"
          }
        },
        quiz: {
          id: "p4-quiz-3",
          title: "Checkpoint: data workflows",
          questions: [
            {
              prompt: "Why is JSON common in applications?",
              choices: [
                "It is a structured text format that maps well to objects and dictionaries",
                "It automatically fixes bugs",
                "It only works in Python",
                "It replaces databases entirely"
              ],
              answer: 0,
              explanation: "JSON is human-readable and machine-readable, which makes it a useful interchange format."
            },
            {
              prompt: "When processing API data, what is still the right starting question?",
              choices: [
                "What exact input structure did I receive?",
                "Can I skip validating the response?",
                "Should I avoid arrays and objects?",
                "Can I guess the data shape from memory?"
              ],
              answer: 0,
              explanation: "You still need to understand the input shape before you can transform it correctly."
            }
          ]
        }
      },
      {
        id: "p4-c4",
        label: "Chapter 4",
        title: "SQL, portfolio projects, and a realistic next-step plan",
        duration: "95 min",
        unlock: "Built on all previous lessons and intended as a bridge into broader internship preparation.",
        outcome: "You should leave with a concrete plan for what to practice next after the IBM assessment.",
        sections: [
          {
            heading: "SQL matters because data lives in tables",
            paragraphs: [
              "Many internships involve reading from or writing to databases. SQL gives you a way to query tabular data without manually looping through everything in application code.",
              "Even basic SQL ideas like SELECT, WHERE, ORDER BY, and GROUP BY are useful career investments."
            ],
            bullets: [
              "SELECT chooses the columns you want",
              "WHERE filters rows",
              "ORDER BY controls sorting",
              "GROUP BY summarizes rows by category"
            ]
          },
          {
            heading: "Projects turn isolated knowledge into visible proof",
            paragraphs: [
              "A small but complete project often teaches more than ten disconnected tutorial snippets.",
              "Useful beginner projects include a task tracker, score analyzer, habit dashboard, flashcard trainer, or study planner with saved data."
            ],
            bullets: [
              "Start with a single user flow",
              "Add tests and polish after the core flow works",
              "Document what you learned and what you would improve next"
            ]
          },
          {
            heading: "Suggested roadmap after this portal",
            paragraphs: [
              "Week 1: redo the Part 3 assessment without help and compare your pacing.",
              "Week 2: build one small project using your stronger language.",
              "Week 3: add tests, a README, and deployment.",
              "Week 4: practice SQL and revisit two medium array or string problems per day."
            ]
          }
        ]
      }
    ],
    assessment: {
      id: "p4-assessment",
      title: "Part 4 capstone reflection",
      description: "This final section is lighter on timed pressure and heavier on applied reasoning. It exists to help you transition from assessment prep into broader skill-building.",
      timerLabel: "Suggested timer: 20 minutes",
      questions: [
        {
          prompt: "What is the healthiest purpose of a portfolio project after assessment prep?",
          choices: [
            "To prove you can connect multiple concepts into something usable",
            "To avoid learning testing",
            "To replace all interview practice forever",
            "To write the largest codebase possible"
          ],
          answer: 0,
          explanation: "Projects show that you can integrate concepts and build something complete, not just solve isolated exercises."
        },
        {
          prompt: "Why is SQL worth learning even if you focus on Python or JavaScript?",
          choices: [
            "Because application work often interacts with tabular stored data",
            "Because SQL replaces programming languages",
            "Because interviews never ask about data",
            "Because it only matters for backend leads"
          ],
          answer: 0,
          explanation: "Databases are common in real systems, and SQL is a standard way to query them."
        }
      ],
      codingChallenges: []
    },
    previous: { href: "part3.html", label: "Back to Part 3" },
    next: { href: "index.html", label: "Restart at Part 1" }
  };

  window.IBM_PREP_CONTENT = {
    meta: {
      title: "IBM Coding Assessment Guide",
      description: "Public beginner-friendly prep portal with guided lessons, coding challenges, quizzes, timers, and saved progress.",
      storageNote: "Accounts and progress are stored in your browser database on this device so the portal works on static GitHub Pages hosting."
    },
    parts: {
      part1,
      part2,
      part3,
      part4
    }
  };
})();
