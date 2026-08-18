# Minimal Authentication System Design

## Color Palette

- **Primary**: Black (#000000)
- **Background**: White (#ffffff)
- **Text Primary**: Slate 900 (#0f172a)
- **Text Secondary**: Slate 500 (#64748b)
- **Text Tertiary**: Slate 400 (#94a3b8)
- **Border**: Slate 200 (#e2e8f0)
- **Hover**: Slate 50 (#f8fafc) or Slate 800 (#1e293b)
- **Accent**: Emerald 400 (#4ade80) for success states

## Typography

- **Font Family**: Plus Jakarta Sans (Google Fonts)
- **Headings**: Semibold (600 weight)
  - H1: 3xl (30px) - "Welcome back", "Create account"
  - H2: 4xl (36px) on desktop
- **Body**: Regular (400 weight)
  - Base: 15px/text-[15px]
  - Label: 14px/text-sm font-medium
  - Small: 13px/text-[13px]
- **Button text**: Medium (500 weight), 16px height with 14px padding

## Spacing & Layout

- **Padding**:
  - Mobile: px-6 (24px horizontal)
  - Desktop: px-8 sm:px-12 lg:px-24 xl:px-32 (responsive)
- **Gap**: space-y-6 (24px vertical between form sections)
- **Border Radius**: rounded-2xl (16px) for inputs and buttons
- **Input Height**: h-14 (56px) - comfortable touch targets
- **Button Height**: h-14 (56px)

## Component Code Snippets

### Auth Header Component

```html
<header class="shrink-0 px-6 pt-14">
  <div class="flex items-center justify-between">
    <a
      :href="homeHref"
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-black transition-opacity hover:opacity-90"
    >
      <div class="h-4 w-4 rounded-full bg-white"></div>
    </a>
  </div>
</header>
```

### Email Input Component

```html
<div class="space-y-2">
  <label for="email" class="ml-0.5 text-sm font-medium text-slate-700"
    >Email address</label
  >
  <div
    class="relative rounded-2xl border border-slate-200 transition-all duration-200 focus-within:border-black"
  >
    <input
      type="email"
      id="email"
      :value="emailValue"
      @input="$emit('change', { value: $event.target.value })"
      placeholder="name@company.com"
      class="h-14 w-full bg-transparent px-4 text-slate-900 outline-none placeholder:text-slate-400"
    />
  </div>
</div>
```

### Password Input Component

```html
<div class="space-y-2">
  <div class="ml-0.5 flex items-center justify-between">
    <label for="password" class="text-sm font-medium text-slate-700"
      >Password</label
    >
    <a
      :href="forgotPasswordHref"
      class="text-sm text-slate-500 transition-colors hover:text-black"
      >Forgot?</a
    >
  </div>
  <div
    class="relative rounded-2xl border border-slate-200 transition-all duration-200 focus-within:border-black"
  >
    <input
      :type="isPasswordVisible ? 'text' : 'password'"
      id="password"
      placeholder="••••••••"
      class="h-14 w-full bg-transparent px-4 text-slate-900 outline-none placeholder:text-slate-400"
      @input="$emit('change', { value: $event.target.value })"
    />
    <button
      type="button"
      class="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      @click="$emit('toggleVisibility')"
    >
      <iconify-icon
        :icon="isPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'"
        width="20"
      ></iconify-icon>
    </button>
  </div>
</div>
```

### Primary Button Component

```html
<button
  type="submit"
  @click="$emit('click')"
  :disabled="isLoading"
  class="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black font-medium text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
>
  <span v-if="!isLoading" class="flex items-center gap-2"
    >Sign In<iconify-icon icon="lucide:arrow-right" width="18"></iconify-icon
  ></span>
  <iconify-icon
    v-if="isLoading"
    icon="lucide:loader-2"
    width="20"
    class="animate-spin"
  ></iconify-icon>
</button>
```

### Secondary Button Component (Google)

```html
<button
  :type="type"
  @click="$emit('click', { label: 'Continue with Google' })"
  class="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 font-medium text-slate-700 transition-colors active:bg-slate-50"
>
  <iconify-icon icon="logos:google-icon" width="20"></iconify-icon>Continue with
  Google
</button>
```

### Auth Divider Component

```html
<div v-if="showDivider" class="mt-8 flex items-center gap-4 py-4">
  <div class="h-[1px] flex-1 bg-slate-100"></div>
  <span class="text-xs font-medium tracking-widest text-slate-400 uppercase"
    >or</span
  >
  <div class="h-[1px] flex-1 bg-slate-100"></div>
</div>
```

### Auth Footer Component

```html
<footer class="shrink-0 px-6 pb-[34px] text-center">
  <p class="text-[15px] text-slate-500">
    Don't have an account?
    <a
      :href="signupHref"
      id="signup-redirect-link"
      class="font-semibold text-black"
      >Create one</a
    >
  </p>
</footer>
```

## Design System Principles

### Focus States

- **Input Focus**: Border transitions from `border-slate-200` to `border-black` (2px solid)
- **Button Hover**: `hover:bg-slate-800` for primary button
- **Link Hover**: `hover:text-black` transition with `transition-colors`

### Animations

- **Fade In**: 0.4-0.6s ease-out from `translateY(10px)` opacity 0
- **Active State**: `active:scale-[0.98]` for tactile feedback
- **Icon Animation**: Group hover with `group-hover:translate-x-1` for arrow on button

### Mobile First

- All touch targets minimum 56px (h-14)
- Comfortable padding and spacing
- Single column layout
- Bottom footer with navigation links

### Desktop Enhancements

- Left sidebar with branding (dark theme #1e293b)
- Right content area with form
- Split 50/50 layout on lg breakpoint
- Additional context: user avatars, security badge
- Floating help icon

### Responsive Breakpoints

- Mobile: Full width
- Tablet (sm:): Increased padding
- Desktop (lg:): Split layout visible
- XL (xl:): Maximum width containers

## Visual Style

**Aesthetic Direction**: Brutally minimal, refined, and professional

- Zero skeuomorphism
- Flat design with subtle depth via shadows
- Maximum readability (high contrast)
- Generous whitespace
- Rational grid-based layout
- No gradients, no blur effects except desktop design accents
- Functional elegance over decoration
