// ═══════════════════════════════════════════════════════
//  AL Qalam EMS — Design System / Theme
//  Matches web EMS colors exactly
// ═══════════════════════════════════════════════════════

export const Colors = {
  // Brand
  gold:    '#fbbf24',
  cyan:    '#00e5ff',
  green:   '#34d399',
  purple:  '#a78bfa',
  red:     '#f87171',
  orange:  '#fb923c',
  aws:     '#ff9900',

  // Backgrounds
  bg:      '#0d1117',
  bg2:     '#161b22',
  bg3:     '#21262d',
  bg4:     '#30363d',

  // Text
  text:    '#e6edf3',
  textMuted: '#8b949e',
  border:  'rgba(255,255,255,0.08)',

  // Portal themes
  admin:   '#fbbf24',   // Gold
  teacher: '#00e5ff',   // Cyan
  student: '#a78bfa',   // Purple
  parent:  '#34d399',   // Green

  // Gradient pairs
  gradients: {
    gold:    ['#fbbf24', '#f59e0b'],
    cyan:    ['#00e5ff', '#0ea5e9'],
    green:   ['#34d399', '#10b981'],
    purple:  ['#a78bfa', '#7c3aed'],
    dark:    ['#161b22', '#0d1117'],
    card:    ['#21262d', '#161b22'],
  }
};

export const Spacing = {
  xs: 4,  sm: 8,  md: 12,  lg: 16,
  xl: 20, '2xl': 24, '3xl': 32, '4xl': 48,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const Font = {
  sm: 12, base: 14, md: 16, lg: 18,
  xl: 20, '2xl': 24, '3xl': 28, '4xl': 34,
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  }
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  gold: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Portal config
export const PortalConfig = {
  admin: {
    color: Colors.admin,
    gradient: Colors.gradients.gold,
    label: 'Admin Portal',
    icon: 'shield',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
  },
  teacher: {
    color: Colors.teacher,
    gradient: Colors.gradients.cyan,
    label: 'Teacher Portal',
    icon: 'chalkboard-teacher',
    bg: 'rgba(0,229,255,0.06)',
    border: 'rgba(0,229,255,0.2)',
  },
  student: {
    color: Colors.student,
    gradient: Colors.gradients.purple,
    label: 'Student Portal',
    icon: 'graduation-cap',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  parent: {
    color: Colors.parent,
    gradient: Colors.gradients.green,
    label: 'Parent Portal',
    icon: 'users',
    bg: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.2)',
  },
};
