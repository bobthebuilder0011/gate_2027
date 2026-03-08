#GATE 2027 – Study Hub

This is a feature-rich, client-side web application designed to streamline preparation for the GATE examination, specifically targeting the Data Science & AI (DA) and Computer Science (CSE) papers. The project leverages a dynamic, mode-aware interface that adjusts its entire curriculum, scoring logic, and color palette based on the user's selected exam track.

**Key Features**
1. _Dynamic Syllabus Management:_ Features an interactive checklist for both DA and CSE syllabi, allowing users to track progress across 200+ individual topics.

2. _Productivity Suite:_ Integrated a real-time study timer and hours tracker with automated estimation logic to predict exam readiness based on current study velocity.

3. _Heuristic Goal Planner:_ Built a "Target Score Planner" that uses an "easy-first" algorithm to allocate marks across subjects based on historical weightage and difficulty ROI.

4. _Adaptive Roadmap Generator:_ Developed a timeline engine that generates phase-based preparation roadmaps (ranging from 2-year plans to crash courses) based on the remaining months until the exam.

5. _Responsive UX/UI:_ Designed a custom, mobile-responsive CSS framework with a persistent state managed via localStorage for seamless data retention without a backend.

**Technical Stack**
**Frontend**: HTML5, CSS3 (Custom Variables/Transitions), JavaScript (ES6+).

**Architecture:** Event-driven DOM manipulation, modular data structures for multi-mode support.

**Storage:** Client-side persistence using the Web Storage API.
