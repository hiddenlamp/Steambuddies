// src/pages/courses/courses.data.js

export const GRADE_GROUPS = [
  { id: "g46", label: { en: "Class 4–6", hi: "कक्षा 4–6" } },
  { id: "g78", label: { en: "Class 7–8", hi: "कक्षा 7–8" } },
  { id: "g910", label: { en: "Class 9–10", hi: "कक्षा 9–10" } },
  { id: "g1112", label: { en: "Class 11–12", hi: "कक्षा 11–12" } },
];

export const CATEGORIES = [
  {
    id: "3d",
    name: { en: "3D Printing & Designing", hi: "3D प्रिंटिंग व डिज़ाइनिंग" },
    icon: "🧩",
    accent: "from-sky-500 via-cyan-400 to-emerald-400",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    id: "scratch",
    name: { en: "Scratch Programming", hi: "Scratch प्रोग्रामिंग" },
    icon: "🎮",
    accent: "from-fuchsia-500 via-pink-400 to-rose-400",
    chip: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  },
  {
    id: "electronics",
    name: { en: "Electronics", hi: "इलेक्ट्रॉनिक्स" },
    icon: "⚡",
    accent: "from-amber-500 via-orange-400 to-yellow-300",
    chip: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    id: "robotics",
    name: { en: "Robotics", hi: "रोबोटिक्स" },
    icon: "🤖",
    accent: "from-indigo-500 via-violet-400 to-fuchsia-400",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    id: "iot",
    name: { en: "IoT", hi: "IoT" },
    icon: "📡",
    accent: "from-emerald-500 via-teal-400 to-cyan-300",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    id: "python",
    name: { en: "Python Programming", hi: "Python प्रोग्रामिंग" },
    icon: "🐍",
    accent: "from-blue-600 via-sky-500 to-indigo-400",
    chip: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    id: "app",
    name: { en: "Basic App Designing", hi: "बेसिक ऐप डिज़ाइनिंग" },
    icon: "📱",
    accent: "from-slate-700 via-slate-500 to-sky-400",
    chip: "bg-slate-50 text-slate-700 ring-slate-200",
  },
];

const yt = (id) => `https://www.youtube.com/embed/${id}`;

export const COURSES = [
  // =========================
  // 3D Printing & Designing
  // =========================
  {
    id: "3d-46-1",
    category: "3d",
    gradeGroup: "g46",
    title: { en: "3D Design Basics (Tinkercad)", hi: "3D डिज़ाइन बेसिक्स (Tinkercad)" },
    level: "Beginner",
    duration: { en: "6–8 sessions", hi: "6–8 सेशन" },
    meta: { lectures: 10, rating: 4.8, language: ["en", "hi"], certificate: true },
    skills: ["Shapes", "Alignment", "Export STL", "Creativity"],
    description: {
      en: "Kids learn 3D shapes, simple models, and how 3D printing works (safe & fun).",
      hi: "बच्चे 3D shapes, simple models और 3D printing का basic workflow सीखते हैं।",
    },
    includes: [
      { en: "Live practical sessions", hi: "Live practical sessions" },
      { en: "Hands-on mini projects", hi: "Hands-on mini projects" },
      { en: "STL export + printing demo", hi: "STL export + printing demo" },
      { en: "Certificate of completion", hi: "Certificate of completion" },
    ],
    projects: ["Name Keychain", "Toy Badge", "Simple House"],
    curriculum: [
      {
        title: { en: "Getting Started", hi: "Getting Started" },
        lessons: [
          { title: { en: "What is 3D Printing?", hi: "3D Printing क्या है?" } },
          { title: { en: "Tinkercad Interface", hi: "Tinkercad Interface" } },
          { title: { en: "Shapes & Grouping", hi: "Shapes & Grouping" } },
        ],
      },
      {
        title: { en: "Make Your First Models", hi: "First Models" },
        lessons: [
          { title: { en: "Alignment & Measuring", hi: "Alignment & Measuring" } },
          { title: { en: "Name Keychain Project", hi: "Name Keychain Project" } },
          { title: { en: "Export STL", hi: "Export STL" } },
        ],
      },
    ],
    videos: [
      { title: { en: "3D Printing Basics", hi: "3D Printing Basics" }, provider: "youtube", freePreview: true, url: yt("R4A2vSgqZ_M") },
      { title: { en: "Tinkercad Quick Tour", hi: "Tinkercad Quick Tour" }, provider: "youtube", freePreview: true, url: yt("FQYhY1G0cJw") },
    ],
    badge: { en: "Most Loved", hi: "सबसे पसंदीदा" },
  },
  {
    id: "3d-78-1",
    category: "3d",
    gradeGroup: "g78",
    title: { en: "3D Designing + Print Workflow", hi: "3D डिज़ाइनिंग + प्रिंट वर्कफ़्लो" },
    level: "Beginner–Intermediate",
    duration: { en: "8–10 sessions", hi: "8–10 सेशन" },
    meta: { lectures: 14, rating: 4.7, language: ["en", "hi"], certificate: true },
    skills: ["3D Modeling", "Slicing", "Supports", "Infill"],
    description: {
      en: "From model to print: students learn slicing & print parameters.",
      hi: "Model से print तक: slicing और print parameters समझते हैं।",
    },
    includes: [
      { en: "Slicer software basics", hi: "Slicer software basics" },
      { en: "Print settings: layer height, infill", hi: "Print settings: layer height, infill" },
      { en: "Support generation", hi: "Support generation" },
      { en: "Mini trophy print demo", hi: "Mini trophy print demo" },
    ],
    projects: ["Phone Stand", "Puzzle Cube", "Mini Trophy"],
    curriculum: [
      {
        title: { en: "Design for Printing", hi: "Design for Printing" },
        lessons: [
          { title: { en: "Tolerance & Fit", hi: "Tolerance & Fit" } },
          { title: { en: "Overhangs & Supports", hi: "Overhangs & Supports" } },
        ],
      },
      {
        title: { en: "Slicing & Printing", hi: "Slicing & Printing" },
        lessons: [
          { title: { en: "Slicer: Profiles", hi: "Slicer: Profiles" } },
          { title: { en: "Infill + Shell", hi: "Infill + Shell" } },
          { title: { en: "Print Troubleshooting", hi: "Print Troubleshooting" } },
        ],
      },
    ],
    videos: [
      { title: { en: "What is Slicing?", hi: "Slicing क्या है?" }, provider: "youtube", freePreview: true, url: yt("1p9q8dQYwSg") },
    ],
  },
  {
    id: "3d-910-1",
    category: "3d",
    gradeGroup: "g910",
    title: { en: "3D Product Design + Prototyping", hi: "3D Product Design + Prototyping" },
    level: "Intermediate",
    duration: { en: "10–12 sessions", hi: "10–12 सेशन" },
    meta: { lectures: 18, rating: 4.8, language: ["en", "hi"], certificate: true },
    skills: ["Prototyping", "Iteration", "Design thinking", "Print optimization"],
    description: {
      en: "Students design usable products, iterate prototypes, and learn real-world design thinking.",
      hi: "Students usable products design करके prototypes iterate करते हैं और design thinking सीखते हैं।",
    },
    includes: [
      { en: "Prototype iterations (v1 → v2)", hi: "Prototype iterations (v1 → v2)" },
      { en: "Real-world product design tasks", hi: "Real-world product design tasks" },
      { en: "Basic costing & material awareness", hi: "Basic costing & material awareness" },
      { en: "Portfolio-ready projects", hi: "Portfolio-ready projects" },
    ],
    projects: ["Desk Organizer", "Cable Clip Set", "Prototype Gadget Case"],
    curriculum: [
      {
        title: { en: "Design Thinking", hi: "Design Thinking" },
        lessons: [
          { title: { en: "Problem selection", hi: "Problem selection" } },
          { title: { en: "Sketch to 3D", hi: "Sketch to 3D" } },
        ],
      },
      {
        title: { en: "Prototype & Improve", hi: "Prototype & Improve" },
        lessons: [
          { title: { en: "Test & feedback", hi: "Test & feedback" } },
          { title: { en: "Optimize for print", hi: "Optimize for print" } },
        ],
      },
    ],
    videos: [{ title: { en: "Prototyping mindset", hi: "Prototyping mindset" }, provider: "youtube", freePreview: true, url: yt("kBqQmS2xq3c") }],
  },

  // =========================
  // Scratch
  // =========================
  {
    id: "sc-46-1",
    category: "scratch",
    gradeGroup: "g46",
    title: { en: "Scratch Starter: Games & Stories", hi: "Scratch Starter: Games & Stories" },
    level: "Beginner",
    duration: { en: "8 sessions", hi: "8 सेशन" },
    meta: { lectures: 12, rating: 4.9, language: ["en", "hi"], certificate: true },
    skills: ["Events", "Loops", "Sprites", "Logic"],
    description: {
      en: "Create stories & games with drag-and-drop coding.",
      hi: "Drag & drop coding से games और stories बनाते हैं।",
    },
    includes: [
      { en: "Game logic practice", hi: "Game logic practice" },
      { en: "Creative storytelling", hi: "Creative storytelling" },
      { en: "Mini game showcase", hi: "Mini game showcase" },
    ],
    projects: ["Catch Game", "Animated Story", "Maze Mini Game"],
    curriculum: [
      {
        title: { en: "Scratch Basics", hi: "Scratch Basics" },
        lessons: [
          { title: { en: "Sprites & stage", hi: "Sprites & stage" } },
          { title: { en: "Events", hi: "Events" } },
          { title: { en: "Loops", hi: "Loops" } },
        ],
      },
      {
        title: { en: "Games", hi: "Games" },
        lessons: [
          { title: { en: "Score system", hi: "Score system" } },
          { title: { en: "Levels", hi: "Levels" } },
        ],
      },
    ],
    videos: [{ title: { en: "Scratch basics", hi: "Scratch basics" }, provider: "youtube", freePreview: true, url: yt("1U8q2G4bQnQ") }],
    badge: { en: "Best for Beginners", hi: "Beginners के लिए बेस्ट" },
  },
  {
    id: "sc-78-1",
    category: "scratch",
    gradeGroup: "g78",
    title: { en: "Scratch: Animation + Game Design", hi: "Scratch: Animation + Game Design" },
    level: "Beginner–Intermediate",
    duration: { en: "10 sessions", hi: "10 सेशन" },
    meta: { lectures: 14, rating: 4.7, language: ["en", "hi"], certificate: true },
    skills: ["Variables", "Clones", "Broadcast", "UI"],
    description: {
      en: "Students build polished games with levels, UI and animations.",
      hi: "Students levels, UI और animations के साथ polished games बनाते हैं।",
    },
    includes: [
      { en: "UI elements: buttons, menus", hi: "UI elements: buttons, menus" },
      { en: "Animations + transitions", hi: "Animations + transitions" },
      { en: "Game level design", hi: "Game level design" },
    ],
    projects: ["Platformer Game", "Space Shooter", "Quiz Game"],
    curriculum: [
      {
        title: { en: "Advanced Blocks", hi: "Advanced Blocks" },
        lessons: [
          { title: { en: "Variables & lists", hi: "Variables & lists" } },
          { title: { en: "Clones", hi: "Clones" } },
        ],
      },
      {
        title: { en: "Game polish", hi: "Game polish" },
        lessons: [
          { title: { en: "UI screens", hi: "UI screens" } },
          { title: { en: "Sound & effects", hi: "Sound & effects" } },
        ],
      },
    ],
    videos: [{ title: { en: "Build a platformer", hi: "Build a platformer" }, provider: "youtube", freePreview: true, url: yt("j_8H3C5mF4k") }],
  },

  // =========================
  // Electronics
  // =========================
  {
    id: "el-46-1",
    category: "electronics",
    gradeGroup: "g46",
    title: { en: "Electronics for Kids (Safe Basics)", hi: "Kids Electronics (Safe Basics)" },
    level: "Beginner",
    duration: { en: "6–8 sessions", hi: "6–8 सेशन" },
    meta: { lectures: 10, rating: 4.6, language: ["en", "hi"], certificate: true },
    skills: ["Battery", "LED", "Switch", "Polarity"],
    description: {
      en: "Understand circuits safely with simple components.",
      hi: "Simple components से safe तरीके से circuits समझते हैं।",
    },
    includes: [
      { en: "Hands-on circuit building", hi: "Hands-on circuit building" },
      { en: "Safe usage + basic rules", hi: "Safe usage + basic rules" },
      { en: "Mini demo projects", hi: "Mini demo projects" },
    ],
    projects: ["LED Torch", "Paper Circuit Card", "Buzzer Alert"],
    curriculum: [
      { title: { en: "Basics", hi: "Basics" }, lessons: [{ title: { en: "Current & voltage", hi: "Current & voltage" } }, { title: { en: "Series vs parallel", hi: "Series vs parallel" } }] },
      { title: { en: "Components", hi: "Components" }, lessons: [{ title: { en: "LED + resistor", hi: "LED + resistor" } }, { title: { en: "Switches", hi: "Switches" } }] },
    ],
    videos: [{ title: { en: "Electronics for kids", hi: "Electronics for kids" }, provider: "youtube", freePreview: true, url: yt("aVv3n0pCkVQ") }],
  },
  {
    id: "el-910-1",
    category: "electronics",
    gradeGroup: "g910",
    title: { en: "Electronics + Microcontrollers (Arduino)", hi: "Electronics + Microcontrollers (Arduino)" },
    level: "Intermediate",
    duration: { en: "10–12 sessions", hi: "10–12 सेशन" },
    meta: { lectures: 18, rating: 4.8, language: ["en", "hi"], certificate: true },
    skills: ["Sensors", "Breadboard", "Arduino IO", "Debugging"],
    description: {
      en: "Students learn sensors + Arduino basics and build real mini devices.",
      hi: "Students sensors + Arduino basics सीखकर real mini devices बनाते हैं।",
    },
    includes: [
      { en: "Arduino coding basics", hi: "Arduino coding basics" },
      { en: "Sensors: LDR, IR, Ultrasonic", hi: "Sensors: LDR, IR, Ultrasonic" },
      { en: "Mini device projects", hi: "Mini device projects" },
    ],
    projects: ["Smart Night Lamp", "Distance Alarm", "IR Counter"],
    curriculum: [
      { title: { en: "Arduino Setup", hi: "Arduino Setup" }, lessons: [{ title: { en: "IDE + board", hi: "IDE + board" } }, { title: { en: "Digital IO", hi: "Digital IO" } }] },
      { title: { en: "Sensors", hi: "Sensors" }, lessons: [{ title: { en: "Ultrasonic basics", hi: "Ultrasonic basics" } }, { title: { en: "LDR control", hi: "LDR control" } }] },
    ],
    videos: [{ title: { en: "Arduino basics", hi: "Arduino basics" }, provider: "youtube", freePreview: true, url: yt("nL34zDTPkcs") }],
  },

  // =========================
  // Robotics
  // =========================
  {
    id: "ro-46-1",
    category: "robotics",
    gradeGroup: "g46",
    title: { en: "Robotics Fun: Build & Move", hi: "Robotics Fun: Build & Move" },
    level: "Beginner",
    duration: { en: "8 sessions", hi: "8 सेशन" },
    meta: { lectures: 12, rating: 4.8, language: ["en", "hi"], certificate: true },
    skills: ["Mechanisms", "Wheels", "Motors", "Teamwork"],
    description: {
      en: "Build simple moving robots and learn how they work through play.",
      hi: "Simple moving robots बनाकर working समझते हैं।",
    },
    includes: [
      { en: "Build + test robot", hi: "Build + test robot" },
      { en: "Motor + battery safety", hi: "Motor + battery safety" },
      { en: "Showcase day", hi: "Showcase day" },
    ],
    projects: ["Vibro Bot", "Motor Car", "Brush Bot"],
    curriculum: [
      { title: { en: "Basics", hi: "Basics" }, lessons: [{ title: { en: "What is a robot?", hi: "Robot क्या है?" } }, { title: { en: "Motors", hi: "Motors" } }] },
      { title: { en: "Build", hi: "Build" }, lessons: [{ title: { en: "Chassis + wheels", hi: "Chassis + wheels" } }, { title: { en: "Testing", hi: "Testing" } }] },
    ],
    videos: [{ title: { en: "Robot basics", hi: "Robot basics" }, provider: "youtube", freePreview: true, url: yt("xKk9J6j7t3Q") }],
    badge: { en: "Most Engaging", hi: "सबसे engaging" },
  },
  {
    id: "ro-910-1",
    category: "robotics",
    gradeGroup: "g910",
    title: { en: "Robotics: Sensors + Line Follower", hi: "Robotics: Sensors + Line Follower" },
    level: "Intermediate",
    duration: { en: "12 sessions", hi: "12 सेशन" },
    meta: { lectures: 20, rating: 4.9, language: ["en", "hi"], certificate: true },
    skills: ["IR sensors", "Motor driver", "PID basics", "Debugging"],
    description: {
      en: "Students build a line follower robot and learn sensors + control logic.",
      hi: "Students line follower robot बनाकर sensors + control logic सीखते हैं।",
    },
    includes: [
      { en: "Complete robot build", hi: "Complete robot build" },
      { en: "Sensor calibration", hi: "Sensor calibration" },
      { en: "Competition-ready tuning", hi: "Competition-ready tuning" },
    ],
    projects: ["Line Follower", "Obstacle Avoider", "Bluetooth Control Bot"],
    curriculum: [
      { title: { en: "Hardware", hi: "Hardware" }, lessons: [{ title: { en: "Motor driver", hi: "Motor driver" } }, { title: { en: "IR array", hi: "IR array" } }] },
      { title: { en: "Control", hi: "Control" }, lessons: [{ title: { en: "Line logic", hi: "Line logic" } }, { title: { en: "PID idea", hi: "PID idea" } }] },
    ],
    videos: [{ title: { en: "Line follower intro", hi: "Line follower intro" }, provider: "youtube", freePreview: true, url: yt("rG6Qyqj7n0I") }],
  },

  // =========================
  // IoT
  // =========================
  {
    id: "io-78-1",
    category: "iot",
    gradeGroup: "g78",
    title: { en: "IoT Basics: Smart Home Mini Projects", hi: "IoT Basics: Smart Home Mini Projects" },
    level: "Beginner",
    duration: { en: "8–10 sessions", hi: "8–10 सेशन" },
    meta: { lectures: 14, rating: 4.6, language: ["en", "hi"], certificate: true },
    skills: ["WiFi", "Sensors", "Dashboard basics"],
    description: {
      en: "Start IoT with fun smart-home ideas and simple dashboards.",
      hi: "Fun smart-home ideas और simple dashboards के साथ IoT start करें।",
    },
    includes: [
      { en: "WiFi basics for IoT", hi: "WiFi basics for IoT" },
      { en: "Sensor reading + alerts", hi: "Sensor reading + alerts" },
      { en: "Dashboard demo", hi: "Dashboard demo" },
    ],
    projects: ["Smart Light Demo", "Room Temp Monitor", "Visitor Counter"],
    curriculum: [
      { title: { en: "IoT Setup", hi: "IoT Setup" }, lessons: [{ title: { en: "What is IoT?", hi: "IoT क्या है?" } }, { title: { en: "WiFi connect", hi: "WiFi connect" } }] },
      { title: { en: "Dashboards", hi: "Dashboards" }, lessons: [{ title: { en: "Send data", hi: "Send data" } }, { title: { en: "See charts", hi: "See charts" } }] },
    ],
    videos: [{ title: { en: "IoT in 10 minutes", hi: "IoT in 10 minutes" }, provider: "youtube", freePreview: true, url: yt("QY9Jt0m8l3Q") }],
  },
  {
    id: "io-910-1",
    category: "iot",
    gradeGroup: "g910",
    title: { en: "IoT with Cloud Dashboards", hi: "IoT + Cloud Dashboard" },
    level: "Intermediate",
    duration: { en: "10–12 sessions", hi: "10–12 सेशन" },
    meta: { lectures: 18, rating: 4.8, language: ["en", "hi"], certificate: true },
    skills: ["WiFi", "MQTT/HTTP", "Cloud", "Visualization"],
    description: {
      en: "Build connected projects and visualize data on cloud dashboards.",
      hi: "Connected projects बनाकर cloud dashboard पर data visualize करते हैं।",
    },
    includes: [
      { en: "Cloud charts + alerts", hi: "Cloud charts + alerts" },
      { en: "HTTP/MQTT concept", hi: "HTTP/MQTT concept" },
      { en: "2 full IoT projects", hi: "2 full IoT projects" },
    ],
    projects: ["Air Quality Monitor", "Water Level Alert"],
    curriculum: [
      { title: { en: "Connectivity", hi: "Connectivity" }, lessons: [{ title: { en: "HTTP vs MQTT", hi: "HTTP vs MQTT" } }, { title: { en: "Device to cloud", hi: "Device to cloud" } }] },
      { title: { en: "Dashboards", hi: "Dashboards" }, lessons: [{ title: { en: "Charts", hi: "Charts" } }, { title: { en: "Alerts", hi: "Alerts" } }] },
    ],
    videos: [{ title: { en: "Dashboards overview", hi: "Dashboards overview" }, provider: "youtube", freePreview: true, url: yt("Y2bD4K9l1nA") }],
  },

  // =========================
  // Python
  // =========================
  {
    id: "py-78-1",
    category: "python",
    gradeGroup: "g78",
    title: { en: "Python Starter: Logic + Mini Programs", hi: "Python Starter: Logic + Mini Programs" },
    level: "Beginner",
    duration: { en: "10 sessions", hi: "10 सेशन" },
    meta: { lectures: 16, rating: 4.7, language: ["en", "hi"], certificate: true },
    skills: ["Variables", "Conditions", "Loops", "Functions"],
    description: {
      en: "Students learn Python basics with fun programs and problem solving.",
      hi: "Students fun programs और problem solving के साथ Python basics सीखते हैं।",
    },
    includes: [
      { en: "Practice sheets + logic tasks", hi: "Practice sheets + logic tasks" },
      { en: "Mini apps", hi: "Mini apps" },
      { en: "Clean coding habits", hi: "Clean coding habits" },
    ],
    projects: ["Number Guess Game", "Calculator", "Pattern Printer"],
    curriculum: [
      { title: { en: "Basics", hi: "Basics" }, lessons: [{ title: { en: "Variables", hi: "Variables" } }, { title: { en: "If/Else", hi: "If/Else" } }, { title: { en: "Loops", hi: "Loops" } }] },
      { title: { en: "Mini Programs", hi: "Mini Programs" }, lessons: [{ title: { en: "Functions", hi: "Functions" } }, { title: { en: "Small games", hi: "Small games" } }] },
    ],
    videos: [{ title: { en: "Python intro", hi: "Python intro" }, provider: "youtube", freePreview: true, url: yt("rfscVS0vtbw") }],
  },
  {
    id: "py-910-1",
    category: "python",
    gradeGroup: "g910",
    title: { en: "Python Projects: Mini Apps", hi: "Python Projects: Mini Apps" },
    level: "Intermediate",
    duration: { en: "12 sessions", hi: "12 सेशन" },
    meta: { lectures: 20, rating: 4.8, language: ["en", "hi"], certificate: true },
    skills: ["Lists", "Files", "Modules", "Debugging"],
    description: {
      en: "Build practical apps and learn clean coding habits.",
      hi: "Practical apps बनाते हैं और clean coding सीखते हैं।",
    },
    includes: [
      { en: "Projects + portfolio", hi: "Projects + portfolio" },
      { en: "File handling basics", hi: "File handling basics" },
      { en: "Mini assessment", hi: "Mini assessment" },
    ],
    projects: ["Student Report App", "Quiz System", "Expense Tracker (CLI)"],
    curriculum: [
      { title: { en: "Core Skills", hi: "Core Skills" }, lessons: [{ title: { en: "Lists & dict", hi: "Lists & dict" } }, { title: { en: "Files", hi: "Files" } }] },
      { title: { en: "Apps", hi: "Apps" }, lessons: [{ title: { en: "Quiz app", hi: "Quiz app" } }, { title: { en: "Report generator", hi: "Report generator" } }] },
    ],
    videos: [{ title: { en: "Files in python", hi: "Files in python" }, provider: "youtube", freePreview: true, url: yt("Uh2ebFW8OYM") }],
  },
  {
    id: "py-1112-1",
    category: "python",
    gradeGroup: "g1112",
    title: { en: "Python + Data + AI Basics", hi: "Python + Data + AI Basics" },
    level: "Intermediate–Advanced",
    duration: { en: "14–16 sessions", hi: "14–16 सेशन" },
    meta: { lectures: 26, rating: 4.9, language: ["en", "hi"], certificate: true },
    skills: ["Data handling", "Visualization", "AI concepts", "Projects"],
    description: {
      en: "Build strong Python foundations with data handling and AI-ready thinking.",
      hi: "Data handling और AI-ready thinking के साथ strong Python foundation बनाइए।",
    },
    includes: [
      { en: "Data mindset + basic charts", hi: "Data mindset + basic charts" },
      { en: "AI concept introduction", hi: "AI concept introduction" },
      { en: "Capstone project", hi: "Capstone project" },
    ],
    projects: ["Data Dashboard (Basics)", "Mini Recommendation Logic", "Capstone Mini Project"],
    curriculum: [
      { title: { en: "Data basics", hi: "Data basics" }, lessons: [{ title: { en: "CSV & cleaning", hi: "CSV & cleaning" } }, { title: { en: "Charts", hi: "Charts" } }] },
      { title: { en: "AI thinking", hi: "AI thinking" }, lessons: [{ title: { en: "What is ML?", hi: "ML क्या है?" } }, { title: { en: "Simple prediction idea", hi: "Simple prediction idea" } }] },
    ],
    videos: [{ title: { en: "AI basics", hi: "AI basics" }, provider: "youtube", freePreview: true, url: yt("aircAruvnKk") }],
  },

  // =========================
  // App Designing
  // =========================
  {
    id: "app-78-1",
    category: "app",
    gradeGroup: "g78",
    title: { en: "App UI Basics: Design Thinking", hi: "App UI Basics: Design Thinking" },
    level: "Beginner",
    duration: { en: "8 sessions", hi: "8 सेशन" },
    meta: { lectures: 12, rating: 4.6, language: ["en", "hi"], certificate: true },
    skills: ["Wireframes", "User flows", "Typography", "Colors"],
    description: {
      en: "Learn how apps are planned: wireframes, flows and UI basics.",
      hi: "Wireframes, flows और UI basics से app planning सीखें।",
    },
    includes: [
      { en: "Wireframes + flows", hi: "Wireframes + flows" },
      { en: "Color + typography rules", hi: "Color + typography rules" },
      { en: "Mini UI portfolio", hi: "Mini UI portfolio" },
    ],
    projects: ["Onboarding Flow", "Home Screen UI", "Profile UI"],
    curriculum: [
      { title: { en: "UX Basics", hi: "UX Basics" }, lessons: [{ title: { en: "User flows", hi: "User flows" } }, { title: { en: "Wireframes", hi: "Wireframes" } }] },
      { title: { en: "UI Basics", hi: "UI Basics" }, lessons: [{ title: { en: "Colors", hi: "Colors" } }, { title: { en: "Typography", hi: "Typography" } }] },
    ],
    videos: [{ title: { en: "UI/UX intro", hi: "UI/UX intro" }, provider: "youtube", freePreview: true, url: yt("3YJYtJr6G8k") }],
  },
  {
    id: "app-910-1",
    category: "app",
    gradeGroup: "g910",
    title: { en: "App Designing Basics (UI/UX)", hi: "App Designing Basics (UI/UX)" },
    level: "Beginner",
    duration: { en: "8–10 sessions", hi: "8–10 सेशन" },
    meta: { lectures: 14, rating: 4.7, language: ["en", "hi"], certificate: true },
    skills: ["Wireframes", "Colors", "Layout", "Components"],
    description: {
      en: "Design modern app screens and user flows like a product designer.",
      hi: "Modern app screens और user flow design करना सीखते हैं।",
    },
    includes: [
      { en: "Full UI flow (Login → Home → Course)", hi: "Full UI flow (Login → Home → Course)" },
      { en: "Reusable components idea", hi: "Reusable components idea" },
      { en: "Mini prototype", hi: "Mini prototype" },
    ],
    projects: ["Login Flow", "Course App UI", "Checkout UI"],
    curriculum: [
      { title: { en: "Flow Design", hi: "Flow Design" }, lessons: [{ title: { en: "App navigation", hi: "App navigation" } }, { title: { en: "Screen consistency", hi: "Screen consistency" } }] },
      { title: { en: "UI System", hi: "UI System" }, lessons: [{ title: { en: "Components", hi: "Components" } }, { title: { en: "Spacing grid", hi: "Spacing grid" } }] },
    ],
    videos: [{ title: { en: "Design systems", hi: "Design systems" }, provider: "youtube", freePreview: true, url: yt("wIuVvCuiJhU") }],
  },
];

export const SORTS = [
  { id: "popular", label: { en: "Most Popular", hi: "सबसे लोकप्रिय" } },
  { id: "title", label: { en: "Title (A–Z)", hi: "Title (A–Z)" } },
  { id: "level", label: { en: "Level", hi: "Level" } },
];

export function levelRank(level) {
  const v = (level || "").toLowerCase();
  if (v.includes("beginner")) return 1;
  if (v.includes("intermediate")) return 2;
  if (v.includes("advanced")) return 3;
  return 99;
}
