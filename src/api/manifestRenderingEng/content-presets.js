/**
 * content-presets.js
 * 
 * 5 content presets per case, embedded as JS objects.
 * Each preset is a complete `content` block ready to drop into a manifest.
 * 
 * API:
 *   getPreset(caseName, presetName) → content object
 *   listPresets(caseName) → string[]
 *   getAllPresets() → Record<case, Record<preset, content>>
 */

// ═══════════════════════════════════════════════════════════════════
//  ACADEMIC HOMEPAGE PRESETS
// ═══════════════════════════════════════════════════════════════════

const ACADEMIC_DEFAULT = {
  name: 'Alex Wang',
  title: 'PhD Student · HCI Research Lab',
  affiliation: 'University of Washington',
  bio: 'I study human-AI interaction and design tools. My research explores how AI can support creative workflows in interface design, bridging the gap between high-level design intent and concrete visual parameters.',
  stats: [
    { label: 'Publications', value: '12' },
    { label: 'Citations', value: '347' },
    { label: 'H-index', value: '8' },
  ],
  navigation: ['About', 'Publications', 'Projects', 'Teaching', 'Contact'],
  news: [
    { date: 'Mar 2025', text: 'Paper accepted at UIST 2025!' },
    { date: 'Jan 2025', text: 'Started internship at Adobe Research' },
    { date: 'Oct 2024', text: 'Gave a talk at MIT Media Lab' },
  ],
  publications: [
    {
      title: 'StyleLens: Exploring Perceptual Dimensions of Visual Style',
      venue: 'UIST 2025', year: 2025, tags: ['HCI', 'Design Tools', 'LLM'],
      abstract: 'We present a framework that decomposes high-level style prompts into adjustable perceptual dimensions through an iterative human-AI card sorting workflow.',
    },
    {
      title: 'Collaborative Style Spaces for UI Customization',
      venue: 'CHI 2025', year: 2025, tags: ['Collaboration', 'Style'],
      abstract: 'This paper explores how multiple stakeholders can navigate shared style spaces to reach consensus on visual design decisions.',
    },
    {
      title: 'Prompt-Driven Theme Generation for Design Systems',
      venue: 'DIS 2024', year: 2024, tags: ['Design Systems', 'AI'],
      abstract: 'We introduce a method for generating coherent design system themes from natural language descriptions using large language models.',
    },
  ],
  projects: [
    { title: 'StyleLens', description: 'LLM-powered style decomposition tool', status: 'active' },
    { title: 'ThemeForge', description: 'Collaborative design token editor', status: 'completed' },
    { title: 'PatchKit', description: 'Visual JSON patch inspector for design tokens', status: 'active' },
  ],
  skills: ['Python', 'React', 'Figma', 'LLM Prompting', 'User Studies', 'D3.js', 'TypeScript', 'Tailwind CSS'],
  links: [
    { label: 'GitHub', url: '#' },
    { label: 'Google Scholar', url: '#' },
    { label: 'Twitter/X', url: '#' },
    { label: 'Email', url: '#' },
  ],
};

const ACADEMIC_SENIOR_PROFESSOR = {
  name: 'Prof. Maria Santos',
  title: 'Professor of Computer Science',
  affiliation: 'ETH Zürich',
  bio: 'I lead the Interactive Systems Lab. Over the past two decades, my group has contributed foundational work in adaptive interfaces, accessibility, and computational design. I am passionate about mentoring the next generation of researchers.',
  stats: [
    { label: 'Publications', value: '186' },
    { label: 'Citations', value: '12,400' },
    { label: 'H-index', value: '48' },
  ],
  navigation: ['About', 'Publications', 'Lab Members', 'Teaching', 'Awards', 'Contact'],
  news: [
    { date: 'Feb 2025', text: 'Keynote at ACM SIGCHI 2025' },
    { date: 'Dec 2024', text: 'Received ACM Distinguished Scientist Award' },
    { date: 'Sep 2024', text: 'New CHI Associate Chair appointment' },
  ],
  publications: [
    {
      title: 'Twenty Years of Adaptive Interfaces: A Retrospective',
      venue: 'TOCHI 2025', year: 2025, tags: ['Survey', 'Adaptive UI'],
      abstract: 'A comprehensive survey of two decades of adaptive interface research, identifying key paradigm shifts and open challenges.',
    },
    {
      title: 'Accessibility-First Design Systems',
      venue: 'CHI 2024', year: 2024, tags: ['Accessibility', 'Design Systems'],
      abstract: 'We propose a methodology for building design systems where accessibility constraints drive visual design decisions rather than being retrofitted.',
    },
    {
      title: 'Computational Layout Optimization Under Cognitive Load Constraints',
      venue: 'UIST 2024', year: 2024, tags: ['Layout', 'Cognition'],
      abstract: 'An optimization framework that generates interface layouts minimizing user cognitive load while satisfying visual design constraints.',
    },
  ],
  projects: [
    { title: 'AdaptUI', description: 'Real-time interface adaptation engine', status: 'active' },
    { title: 'A11yKit', description: 'Automated accessibility testing suite', status: 'active' },
    { title: 'LayoutOpt', description: 'Constraint-based layout optimizer', status: 'completed' },
  ],
  skills: ['Experimental Design', 'Statistical Analysis', 'Grant Writing', 'Mentoring', 'Java', 'Python', 'LaTeX'],
  links: [
    { label: 'Lab Website', url: '#' },
    { label: 'Google Scholar', url: '#' },
    { label: 'DBLP', url: '#' },
    { label: 'Email', url: '#' },
  ],
};

const ACADEMIC_INDUSTRY_RESEARCHER = {
  name: 'Kai Nakamura',
  title: 'Research Scientist',
  affiliation: 'Google DeepMind',
  bio: 'I work at the intersection of machine learning and interactive systems. My focus is on building intelligent tools that understand user intent and adapt in real-time. Previously at Apple and Meta Reality Labs.',
  stats: [
    { label: 'Publications', value: '34' },
    { label: 'Patents', value: '7' },
    { label: 'Open Source', value: '15 repos' },
  ],
  navigation: ['About', 'Research', 'Patents', 'Talks', 'Open Source', 'Contact'],
  news: [
    { date: 'Mar 2025', text: 'Released IntentKit v2.0 on GitHub' },
    { date: 'Jan 2025', text: 'Talk at NeurIPS workshop on Interactive ML' },
    { date: 'Nov 2024', text: 'Patent granted: Adaptive UI Generation System' },
  ],
  publications: [
    {
      title: 'Intent-Aware Interface Generation with Reinforcement Learning',
      venue: 'NeurIPS 2025', year: 2025, tags: ['RL', 'UI Generation'],
      abstract: 'We train an RL agent to generate interface layouts that maximize task completion efficiency based on inferred user intent.',
    },
    {
      title: 'Real-Time Style Transfer for Adaptive Theming',
      venue: 'SIGGRAPH 2024', year: 2024, tags: ['Style Transfer', 'Real-Time'],
      abstract: 'A lightweight neural style transfer model that runs at 60fps for dynamic UI theme adaptation.',
    },
    {
      title: 'Multimodal Input Fusion for Creative Tools',
      venue: 'UIST 2024', year: 2024, tags: ['Multimodal', 'Creative Tools'],
      abstract: 'A framework for fusing voice, gesture, and text inputs into coherent design actions in creative applications.',
    },
  ],
  projects: [
    { title: 'IntentKit', description: 'Open-source intent recognition library', status: 'active' },
    { title: 'ThemeMorph', description: 'Neural style transfer for UI theming', status: 'active' },
    { title: 'FusionInput', description: 'Multimodal input SDK', status: 'completed' },
  ],
  skills: ['PyTorch', 'TensorFlow', 'C++', 'Rust', 'React', 'CUDA', 'MLOps', 'System Design'],
  links: [
    { label: 'GitHub', url: '#' },
    { label: 'Google Scholar', url: '#' },
    { label: 'LinkedIn', url: '#' },
    { label: 'Blog', url: '#' },
  ],
};

const ACADEMIC_EARLY_CAREER = {
  name: 'Sam Rivera',
  title: '1st Year PhD Student · Visual Computing',
  affiliation: 'Stanford University',
  bio: "I'm just getting started in research! I'm interested in how generative AI can help non-designers create beautiful interfaces. Before grad school, I worked as a frontend developer for 3 years.",
  stats: [
    { label: 'Publications', value: '1' },
    { label: 'Workshops', value: '2' },
    { label: 'Projects', value: '5' },
  ],
  navigation: ['About', 'Research', 'Projects', 'Blog', 'Contact'],
  news: [
    { date: 'Feb 2025', text: 'Workshop paper accepted at CHI 2025 LBW' },
    { date: 'Sep 2024', text: 'Started PhD at Stanford!' },
    { date: 'Jun 2024', text: 'Left my job at Figma to pursue research' },
  ],
  publications: [
    {
      title: 'Can LLMs Be Design Critics? A Preliminary Study',
      venue: 'CHI 2025 LBW', year: 2025, tags: ['LLM', 'Design Critique'],
      abstract: 'We conducted a preliminary study evaluating whether large language models can provide useful design feedback comparable to human experts.',
    },
  ],
  projects: [
    { title: 'DesignBot', description: 'AI design feedback chatbot prototype', status: 'active' },
    { title: 'ColorSense', description: 'Accessible color palette generator', status: 'active' },
    { title: 'LayoutGPT', description: 'Experimental LLM-based layout tool', status: 'active' },
    { title: 'Portfolio v3', description: 'This website (built with Next.js)', status: 'completed' },
    { title: 'Figma Plugin: AutoSpace', description: 'Auto-spacing plugin for Figma', status: 'completed' },
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Figma', 'CSS', 'HTML', 'Node.js', 'Git'],
  links: [
    { label: 'GitHub', url: '#' },
    { label: 'Twitter/X', url: '#' },
    { label: 'Blog', url: '#' },
    { label: 'Email', url: '#' },
  ],
};

const ACADEMIC_INTERDISCIPLINARY = {
  name: 'Dr. Aisha Patel',
  title: 'Postdoctoral Researcher · Computational Neuroscience × HCI',
  affiliation: 'MIT CSAIL',
  bio: 'I bridge neuroscience and human-computer interaction. My research uses brain imaging and computational modeling to understand how people perceive and interact with visual interfaces, with the goal of building neurally-informed design tools.',
  stats: [
    { label: 'Publications', value: '22' },
    { label: 'Citations', value: '890' },
    { label: 'Collaborators', value: '14 labs' },
  ],
  navigation: ['About', 'Research', 'Publications', 'Collaborations', 'Teaching', 'Contact'],
  news: [
    { date: 'Mar 2025', text: 'Joint paper with neuroscience + design groups accepted at Nature HB' },
    { date: 'Jan 2025', text: 'Visiting researcher at Max Planck Institute' },
    { date: 'Nov 2024', text: 'Organized cross-disciplinary workshop at NeurIPS' },
  ],
  publications: [
    {
      title: 'Neural Correlates of Aesthetic Preference in Interface Design',
      venue: 'Nature Human Behaviour 2025', year: 2025, tags: ['Neuroscience', 'Aesthetics', 'fMRI'],
      abstract: 'Using fMRI we identify neural signatures that predict aesthetic preference for interface layouts, revealing shared neural pathways with art appreciation.',
    },
    {
      title: 'EEG-Guided Adaptive Interface Optimization',
      venue: 'CHI 2024', year: 2024, tags: ['BCI', 'Adaptive UI', 'EEG'],
      abstract: 'We demonstrate a real-time system that adjusts interface parameters based on EEG signals indicating cognitive load and engagement.',
    },
    {
      title: 'Perceptual Dimensions of Visual Complexity in UIs',
      venue: 'JOV 2024', year: 2024, tags: ['Perception', 'Complexity', 'Psychophysics'],
      abstract: 'A psychophysical study identifying four orthogonal perceptual dimensions that people use to judge visual complexity in user interfaces.',
    },
  ],
  projects: [
    { title: 'NeuroDesign', description: 'fMRI-informed design recommendation engine', status: 'active' },
    { title: 'EEG-Adapt', description: 'Real-time EEG-driven UI adaptation', status: 'active' },
    { title: 'PercepMap', description: 'Perceptual dimension mapping toolkit', status: 'completed' },
  ],
  skills: ['Python', 'MATLAB', 'fMRI Analysis', 'EEG', 'PsychoPy', 'R', 'React', 'TensorFlow', 'Statistics'],
  links: [
    { label: 'Google Scholar', url: '#' },
    { label: 'ORCID', url: '#' },
    { label: 'Lab Website', url: '#' },
    { label: 'Email', url: '#' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
//  REGISTRY & API
// ═══════════════════════════════════════════════════════════════════

const PRESET_REGISTRY = {
  'academic-homepage': {
    'default': ACADEMIC_DEFAULT,
    'senior-professor': ACADEMIC_SENIOR_PROFESSOR,
    'industry-researcher': ACADEMIC_INDUSTRY_RESEARCHER,
    'early-career': ACADEMIC_EARLY_CAREER,
    'interdisciplinary': ACADEMIC_INTERDISCIPLINARY,
  },
};

/**
 * Get a content preset. Returns a deep clone (safe to mutate).
 */
export function getPreset(caseName, presetName = 'default') {
  const casePresets = PRESET_REGISTRY[caseName];
  if (!casePresets) {
    throw new Error(`Unknown case: "${caseName}". Available: ${Object.keys(PRESET_REGISTRY).join(', ')}`);
  }
  const preset = casePresets[presetName];
  if (!preset) {
    throw new Error(`Unknown preset "${presetName}" for case "${caseName}". Available: ${Object.keys(casePresets).join(', ')}`);
  }
  return JSON.parse(JSON.stringify(preset));
}

/**
 * List available preset names for a case.
 */
export function listPresets(caseName) {
  const casePresets = PRESET_REGISTRY[caseName];
  if (!casePresets) return [];
  return Object.keys(casePresets);
}

/**
 * Get all presets across all cases.
 */
export function getAllPresets() {
  return JSON.parse(JSON.stringify(PRESET_REGISTRY));
}

/**
 * Register a custom preset at runtime.
 */
export function registerPreset(caseName, presetName, content) {
  if (!PRESET_REGISTRY[caseName]) {
    PRESET_REGISTRY[caseName] = {};
  }
  PRESET_REGISTRY[caseName][presetName] = JSON.parse(JSON.stringify(content));
}
