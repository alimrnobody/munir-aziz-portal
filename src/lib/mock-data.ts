export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

export interface Phase {
  id: string;
  title: string;
  locked: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  phases: Phase[];
  progress: number;
}

export const mockCourses: Course[] = [
  {
    id: "ai-automation",
    title: "AI Automation Mastery",
    description: "Master the art of AI-powered automation. Build intelligent systems that work for you 24/7.",
    thumbnail: "",
    progress: 35,
    phases: [
      {
        id: "p1",
        title: "Phase 1 — Foundations",
        locked: false,
        lessons: [
          { id: "l1", title: "Introduction to AI Automation", duration: "12:30", completed: true },
          { id: "l2", title: "Setting Up Your Environment", duration: "18:45", completed: true },
          { id: "l3", title: "First Automation Script", duration: "24:10", completed: false },
        ],
      },
      {
        id: "p2",
        title: "Phase 2 — Advanced Workflows",
        locked: true,
        lessons: [
          { id: "l4", title: "Multi-Step Automations", duration: "20:00", completed: false },
          { id: "l5", title: "API Integrations", duration: "32:15", completed: false },
        ],
      },
      {
        id: "p3",
        title: "Phase 3 — Deployment",
        locked: true,
        lessons: [
          { id: "l6", title: "Cloud Deployment", duration: "28:00", completed: false },
          { id: "l7", title: "Monitoring & Scaling", duration: "22:30", completed: false },
        ],
      },
    ],
  },
  {
    id: "web-hacking",
    title: "Ethical Hacking Bootcamp",
    description: "Learn penetration testing, vulnerability assessment, and ethical hacking techniques.",
    thumbnail: "",
    progress: 0,
    phases: [
      {
        id: "p4",
        title: "Phase 1 — Recon & Enumeration",
        locked: false,
        lessons: [
          { id: "l8", title: "Information Gathering", duration: "15:00", completed: false },
          { id: "l9", title: "Network Scanning", duration: "22:00", completed: false },
        ],
      },
      {
        id: "p5",
        title: "Phase 2 — Exploitation",
        locked: true,
        lessons: [
          { id: "l10", title: "Common Vulnerabilities", duration: "30:00", completed: false },
          { id: "l11", title: "Post-Exploitation", duration: "25:00", completed: false },
        ],
      },
    ],
  },
  {
    id: "dark-python",
    title: "Python for Cyber Ops",
    description: "Write powerful Python scripts for security operations, automation and data extraction.",
    thumbnail: "",
    progress: 72,
    phases: [
      {
        id: "p6",
        title: "Phase 1 — Python Essentials",
        locked: false,
        lessons: [
          { id: "l12", title: "Python Crash Course", duration: "35:00", completed: true },
          { id: "l13", title: "File & Network I/O", duration: "28:00", completed: true },
          { id: "l14", title: "Web Scraping", duration: "20:00", completed: true },
        ],
      },
      {
        id: "p7",
        title: "Phase 2 — Security Scripts",
        locked: false,
        lessons: [
          { id: "l15", title: "Port Scanner", duration: "18:00", completed: true },
          { id: "l16", title: "Password Tools", duration: "25:00", completed: false },
        ],
      },
    ],
  },
];

export const mockUser = {
  email: "agent@mrnobody.squad",
  name: "Agent Zero",
};
