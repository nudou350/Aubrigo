# Pet Adoption App - Theme Guideline

This document provides comprehensive design guidelines and tokens for the Pet Adoption App. All agents and developers should reference this document when building UI components to ensure design consistency.

## 📱 Design Overview

- **Target Platform**: Mobile-first (414px width)
- **Design System**: Custom design with clean, friendly aesthetics
- **Primary Use Case**: Pet adoption and rescue organization platform
- **Language**: Portuguese (Brazil/Portugal)

---

## 🎨 Color Palette

### Primary Colors

```css
/* Primary Brand Color - Teal/Turquoise */
--color-primary: #4ca8a0;
--color-primary-light: rgba(76, 168, 160, 0.18);
--color-primary-lighter: rgba(76, 168, 160, 0.12);

/* Secondary Brand Color - Pink (used for female pets) */
--color-secondary: #f4a3b8;
```

### Neutral Colors

```css
/* Text Colors */
--color-text-primary: #161616;
--color-text-secondary: #333333;

/* Background Colors */
--color-background: #ffffff;
--color-background-secondary: #f5f5f5; /* Tailwind: neutral-100 */

/* Border and Divider */
--color-border: #e5e5e5;
```

### Semantic Colors

```css
/* Success (uses primary color) */
--color-success: #4ca8a0;

/* Warning/Alert */
--color-warning: #fbbf24;

/* Error */
--color-error: #ef4444;
```

### Usage Guidelines

- **Primary (#4ca8a0)**: Use for buttons, active states, navigation highlights, male pet indicators
- **Secondary (#f4a3b8)**: Use for female pet indicators, secondary actions
- **Text Primary (#161616)**: Body text, headings, labels
- **Text Secondary (#333333)**: Secondary information, timestamps
- **Background Secondary (#f5f5f5)**: Cards, input fields, disabled states

---

## 📝 Typography

### Font Families

```css
/* Primary Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Secondary Font Family (for time display) */
--font-secondary: 'Neue Haas Grotesk Display Pro', sans-serif;
```

### Font Sizes

```css
/* Heading Sizes */
--font-size-h1: 24px;  /* Page titles, user greetings */
--font-size-h2: 20px;  /* Pet names, section titles */
--font-size-h3: 18px;  /* Card information, labels */

/* Body Sizes */
--font-size-base: 16px;     /* Navigation, buttons */
--font-size-small: 14px;    /* Body text, descriptions, button text */
--font-size-tiny: 12px;     /* Helper text, captions */
```

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
```

### Typography Scale

| Element | Size | Weight | Font Family | Use Case |
|---------|------|--------|-------------|----------|
| Page Title | 24px | Semi Bold (600) | Inter | "Hello, João", "Pets", "Doar" |
| Section Title | 20px | Semi Bold (600) | Inter | Pet names (Plutão, Nina) |
| Card Label | 18px | Medium (500) | Inter | Pet details (Lisboa, Masculino, Grande) |
| Navigation | 16px | Semi Bold (600) | Inter | "HOME", "DOAR" navigation items |
| Button Text | 14px-16px | Semi Bold (600) | Inter | "SABER MAIS", "AGENDAR VISITA" |
| Body Text | 14px | Regular (400) | Inter | Pet descriptions, form text |
| Time Display | 14px | Medium (500) | Neue Haas Grotesk | Status bar time "17:47" |

### Line Height

```css
--line-height-tight: 1.2;    /* Headings */
--line-height-normal: 1.5;   /* Body text */
--line-height-relaxed: 1.75; /* Long-form content */
```

---

## 📏 Spacing System

### Base Spacing Unit

```css
--spacing-unit: 4px; /* Base unit for all spacing */
```

### Spacing Scale

```css
--spacing-xs: 4px;    /* 1 unit */
--spacing-sm: 8px;    /* 2 units */
--spacing-md: 16px;   /* 4 units */
--spacing-lg: 20px;   /* 5 units */
--spacing-xl: 24px;   /* 6 units */
--spacing-2xl: 32px;  /* 8 units */
--spacing-3xl: 48px;  /* 12 units */
```

### Common Spacing Patterns

| Element | Spacing | Notes |
|---------|---------|-------|
| Screen padding | 20-21px | Horizontal screen margins |
| Card padding | 16px | Internal card spacing |
| Between cards | 16px | Vertical gap between cards |
| Form input spacing | 103px | Gap between form fields |
| Button padding | 16px vertical, 24px horizontal | Standard button padding |
| Icon margin | 8px | Space between icon and text |
| Section margin | 24-32px | Between major sections |

---

## 🔲 Border Radius

```css
/* Border Radius Scale */
--radius-sm: 2px;     /* Small elements, image corners */
--radius-md: 6px;     /* Cards, inputs, category boxes */
--radius-lg: 16px;    /* Buttons, bottom navigation */
--radius-full: 9999px; /* Circular elements (profile pictures) */
```

### Usage Guidelines

- **2px**: Pet category image corners, small decorative elements
- **6px**: Primary cards, input fields, category selector boxes
- **16px**: Primary buttons, call-to-action buttons
- **Full (50%)**: Profile pictures, circular badges

---

## 🌑 Shadows

### Shadow Scale

```css
/* Card Shadow - Subtle elevation */
--shadow-card: 0px 2px 18px 0px rgba(22, 22, 22, 0.12);

/* Button Shadow - More prominent */
--shadow-button: 0px 2px 16px 0px rgba(22, 22, 22, 0.17);

/* Light Shadow - Very subtle */
--shadow-light: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
```

### Usage Guidelines

- **Card Shadow**: Pet cards, form containers, information cards
- **Button Shadow**: User profile button, elevated interactive elements
- **Light Shadow**: Hover states, secondary elements

---

## 🎯 Component Guidelines

### Buttons

#### Primary Button
```css
background: #4ca8a0;
color: #ffffff;
padding: 16px 24px;
border-radius: 16px;
font-size: 14px;
font-weight: 600;
text-transform: uppercase;
box-shadow: none;
```

**Usage**: Primary actions like "SABER MAIS", "AGENDAR VISITA", "LOGIN", "CADASTRAR"

#### Secondary Button (Pink)
```css
background: #f4a3b8;
color: #ffffff;
padding: 16px 24px;
border-radius: 16px;
font-size: 14px;
font-weight: 600;
text-transform: uppercase;
```

**Usage**: Female pet-related actions

#### Text Button
```css
background: transparent;
color: #4ca8a0;
font-size: 14px;
font-weight: 600;
```

**Usage**: "Voltar", "Cancelar", secondary actions

### Cards

#### Pet Card
```css
background: #f5f5f5;
border-radius: 6px;
padding: 16px;
box-shadow: 0px 2px 18px 0px rgba(22, 22, 22, 0.12);
```

**Structure**:
- Image (341px × 217px) at top with no border radius on image itself
- Pet name (20px, Semi Bold, color based on gender)
- Details grid (18px, Medium)
- Description (14px, Regular)
- Action button at bottom

#### Category Box
```css
width: 79px;
height: 80px;
background: #f5f5f5; /* Default state */
background: #4ca8a0; /* Active state */
border-radius: 6px;
box-shadow: 0px 2px 18px 0px rgba(22, 22, 22, 0.12);
```

### Input Fields

#### Text Input
```css
background: rgba(76, 168, 160, 0.12);
border: none;
border-radius: 6px;
padding: 12px 16px;
height: 44px;
font-size: 16px;
color: #161616;
```

#### Label
```css
font-size: 19px;
font-weight: 400;
color: #161616;
margin-bottom: 8px;
```

### Navigation

#### Bottom Navigation Bar
```css
height: 68px;
background: rgba(76, 168, 160, 0.18);
position: fixed;
bottom: 0;
width: 100%;
```

**Navigation Items**:
```css
/* Active state */
color: #4ca8a0;
font-size: 16px;
font-weight: 600;

/* Inactive state */
color: #666666;
opacity: 0.6;
```

### Location Badge
```css
background: rgba(76, 168, 160, 0.12);
border-radius: 6px;
height: 44px;
padding: 0 16px;
display: flex;
align-items: center;
```

---

## 📐 Layout Guidelines

### Screen Structure

```
┌─────────────────────────────┐
│  Status Bar (25px)          │
│  ┌───────────────────────┐  │
│  │ Page Title (48px top) │  │
│  └───────────────────────┘  │
│  Content Area               │
│  (padding: 20px horizontal) │
│                             │
│                             │
│                             │
│  ┌───────────────────────┐  │
│  │ Bottom Nav (68px)     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Grid System

- **Screen Width**: 414px (mobile)
- **Content Padding**: 20-21px horizontal
- **Card Width**: Full width minus padding (373-374px)
- **Category Grid**: 4 columns with 20px spacing between

### Breakpoints

```css
/* This is a mobile-first design */
--breakpoint-mobile: 414px;

/* Future expansion (not in current design) */
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
```

---

## 🖼️ Images & Media

### Image Sizes

| Component | Width | Height | Aspect Ratio | Border Radius |
|-----------|-------|--------|--------------|---------------|
| Pet Card Image | 341px | 217px | ~1.57:1 | 0px |
| Category Icon | 51px | 51px | 1:1 | 2px |
| Profile Picture | 55px | 55px | 1:1 | Full (circular) |
| User Button | 34px | 33px | ~1:1 | 6px |
| Pet Detail Image | 374px | 222px | ~1.68:1 | 6px |

### Image Guidelines

- Use high-quality images for pet photos
- Maintain consistent aspect ratios
- Optimize images for mobile (max 2x resolution)
- Use lazy loading for scrollable content

---

## 🎨 Icons

### Icon System

- **Primary Icon Color**: #4ca8a0
- **Secondary Icon Color**: #161616
- **Icon Size (Small)**: 18px × 18px
- **Icon Size (Medium)**: 24px × 24px
- **Icon Stroke Width**: 2px

### Common Icons

| Icon | Usage | Size |
|------|-------|------|
| Home | Navigation, organization indicator | 19-24px |
| User | Profile, user actions | 24px |
| Location Pin | Location indicators | 14px |
| Gender (Male/Female) | Pet gender indicators | 17-19px |
| Age/Calendar | Age indicators | 17px |
| Size/Ruler | Size indicators | 18.2px |
| Phone | Contact information | 24px |
| Mail | Email contact | 24px |
| Instagram | Social media | 24px |
| Heart | Favorites, likes | 24px |

---

## 📱 Interaction States

### Button States

```css
/* Default */
background: #4ca8a0;
transform: scale(1);

/* Hover (desktop) */
background: #3d9690;
cursor: pointer;

/* Active/Pressed */
background: #2d7670;
transform: scale(0.98);

/* Disabled */
background: #e5e5e5;
color: #999999;
cursor: not-allowed;
```

### Input States

```css
/* Default */
background: rgba(76, 168, 160, 0.12);
border: 2px solid transparent;

/* Focus */
background: rgba(76, 168, 160, 0.18);
border: 2px solid #4ca8a0;
outline: none;

/* Error */
border: 2px solid #ef4444;
```

### Card States

```css
/* Default */
transform: scale(1);
box-shadow: 0px 2px 18px 0px rgba(22, 22, 22, 0.12);

/* Hover */
transform: translateY(-2px);
box-shadow: 0px 4px 24px 0px rgba(22, 22, 22, 0.16);
cursor: pointer;
```

---

## ♿ Accessibility Guidelines

### Color Contrast

- Ensure minimum contrast ratio of 4.5:1 for normal text
- Ensure minimum contrast ratio of 3:1 for large text (18px+)
- Primary button text (#ffffff) on primary background (#4ca8a0): **Passes WCAG AA**

### Touch Targets

- Minimum touch target size: **44px × 44px**
- Maintain at least 8px spacing between interactive elements

### Focus Indicators

```css
/* Visible focus state for keyboard navigation */
:focus-visible {
  outline: 2px solid #4ca8a0;
  outline-offset: 2px;
}
```

### Alt Text

- Provide descriptive alt text for all pet images
- Format: "[Pet name], [breed/type], [distinguishing features]"
- Example: "Plutão, Border Collie, black and white dog"

---

## 🌍 Localization Considerations

### Text Length

- Allow 30% extra space for Portuguese text compared to English
- Buttons should accommodate longer text without breaking
- Test all labels with maximum expected character count

### Date & Number Formats

- Date format: DD/MM/YYYY
- Currency: EUR (€) or BRL (R$) depending on region
- Distance: kilometers (km)

---

## 🎯 Design Tokens Summary (JSON)

```json
{
  "colors": {
    "primary": "#4ca8a0",
    "primaryLight": "rgba(76, 168, 160, 0.18)",
    "primaryLighter": "rgba(76, 168, 160, 0.12)",
    "secondary": "#f4a3b8",
    "textPrimary": "#161616",
    "textSecondary": "#333333",
    "background": "#ffffff",
    "backgroundSecondary": "#f5f5f5",
    "border": "#e5e5e5"
  },
  "typography": {
    "fontFamily": {
      "primary": "Inter, sans-serif",
      "secondary": "Neue Haas Grotesk Display Pro, sans-serif"
    },
    "fontSize": {
      "h1": "24px",
      "h2": "20px",
      "h3": "18px",
      "base": "16px",
      "small": "14px",
      "tiny": "12px"
    },
    "fontWeight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "20px",
    "xl": "24px",
    "2xl": "32px",
    "3xl": "48px"
  },
  "borderRadius": {
    "sm": "2px",
    "md": "6px",
    "lg": "16px",
    "full": "9999px"
  },
  "shadows": {
    "card": "0px 2px 18px 0px rgba(22, 22, 22, 0.12)",
    "button": "0px 2px 16px 0px rgba(22, 22, 22, 0.17)",
    "light": "0px 2px 8px 0px rgba(0, 0, 0, 0.08)"
  },
  "layout": {
    "mobileWidth": "414px",
    "contentPadding": "20px",
    "bottomNavHeight": "68px"
  }
}
```

---

## 🚀 Implementation Checklist

When implementing designs, ensure:

- [ ] All colors match the defined palette exactly
- [ ] Typography uses Inter font family with correct weights
- [ ] Spacing follows the 4px base unit system
- [ ] Border radius values match the scale (2px, 6px, 16px)
- [ ] Shadows use the defined shadow tokens
- [ ] Buttons are minimum 44px height for accessibility
- [ ] Interactive elements have clear hover/focus states
- [ ] Images maintain the correct aspect ratios
- [ ] Text is properly localized for Portuguese
- [ ] Color contrast meets WCAG AA standards

---

## 📝 Notes for Developers

### CSS Custom Properties Setup

```css
:root {
  /* Colors */
  --color-primary: #4ca8a0;
  --color-primary-light: rgba(76, 168, 160, 0.18);
  --color-secondary: #f4a3b8;
  --color-text: #161616;
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-size-h1: 24px;
  --font-size-base: 16px;
  --font-weight-semibold: 600;
  
  /* Spacing */
  --spacing-md: 16px;
  --spacing-lg: 20px;
  
  /* Border Radius */
  --radius-md: 6px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-card: 0px 2px 18px 0px rgba(22, 22, 22, 0.12);
}
```

### Tailwind Configuration

If using Tailwind CSS, extend the theme:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#4ca8a0',
        secondary: '#f4a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1': '24px',
        'h2': '20px',
      },
      borderRadius: {
        'card': '6px',
        'button': '16px',
      },
      boxShadow: {
        'card': '0px 2px 18px 0px rgba(22, 22, 22, 0.12)',
      },
    },
  },
};
```

---

## 🔄 Version History

- **v1.0** - Initial theme guideline based on Figma design (App project)
- Date: 2025-11-02
- Based on Figma file: `vHdTgQtMUDaSF7FUiWwz3M`

---

## 📧 Contact

For questions about this design system or clarifications on implementation, please refer back to the original Figma file or contact the design team.

---

**Remember**: Consistency is key! Always refer to this guideline when building new features or components to maintain a cohesive user experience across the entire application.
