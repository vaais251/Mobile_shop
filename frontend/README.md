# Mobile Store Frontend

A Next.js 14+ frontend for the second-hand phone e-commerce platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── (auth)/             # Auth routes (login, register)
│   ├── phones/             # Phone listing pages
│   ├── cart/               # Shopping cart
│   ├── orders/             # Order management
│   ├── chat/               # Chat system
│   └── admin/              # Admin dashboard
│
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── layout/             # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── sidebar.tsx
│   └── phones/             # Phone-specific components
│       ├── phone-card.tsx
│       └── phone-filters.tsx
│
├── lib/
│   ├── api.ts              # API client
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
│
└── public/                 # Static assets
```

## 🎨 Design System

The UI uses a modern dark theme with:
- **Colors**: Violet/Indigo gradients on dark backgrounds
- **Effects**: Glassmorphism, subtle shadows
- **Typography**: Inter font (via Next.js)
- **Animations**: Smooth transitions and hover effects

## 🔧 Environment Variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_APP_NAME="Mobile Store"
```

## 📱 Features (Coming Soon)

- [ ] Phone browsing with filters
- [ ] User authentication
- [ ] Shopping cart
- [ ] Checkout with multiple payment methods
- [ ] Order tracking
- [ ] Seller dashboard
- [ ] Admin panel
- [ ] Chat system
